using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text.Json;
using TicTacToe.Api.Application;

namespace TicTacToe.Api;

public sealed class LocalWebSocketHub : IGameBroadcaster
{
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, WebSocket>> subscriptions = new(StringComparer.Ordinal);
    private readonly JsonSerializerOptions json;

    public LocalWebSocketHub(JsonSerializerOptions json) => this.json = json;

    public void Subscribe(string connectionId, string gameId, WebSocket socket) =>
        subscriptions.GetOrAdd(gameId, _ => new ConcurrentDictionary<string, WebSocket>(StringComparer.Ordinal))[connectionId] = socket;

    public void Remove(string connectionId)
    {
        foreach (var game in subscriptions)
        {
            game.Value.TryRemove(connectionId, out _);
            if (game.Value.IsEmpty) subscriptions.TryRemove(game.Key, out _);
        }
    }

    public async Task PublishAsync(GameEvent gameEvent, CancellationToken cancellationToken)
    {
        if (!subscriptions.TryGetValue(gameEvent.GameId, out var listeners)) return;
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            version = 1,
            type = "game.event",
            gameEvent.EventId,
            gameEvent.GameId,
            gameEvent.Sequence,
            gameEvent.OccurredAt,
            eventType = gameEvent.Type,
            gameEvent.Data,
            state = gameEvent.State
        }, json);
        foreach (var listener in listeners.ToArray())
        {
            try
            {
                if (listener.Value.State != WebSocketState.Open) throw new WebSocketException("The socket is not open.");
                await listener.Value.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
            }
            catch (Exception) when (!cancellationToken.IsCancellationRequested)
            {
                listeners.TryRemove(listener.Key, out _);
            }
        }
    }
}
