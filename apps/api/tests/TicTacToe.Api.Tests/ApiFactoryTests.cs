using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace TicTacToe.Api.Tests;

public sealed class ApiFactoryTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public ApiFactoryTests(WebApplicationFactory<Program> factory) => client = factory.CreateClient();

    [Fact]
    public async Task Health_and_create_routes_are_hosted()
    {
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        var response = await client.PostAsJsonAsync("/api/v1/games", new { commandId = Guid.NewGuid() });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":\"waiting\"", body);
        Assert.Contains("\"mark\":\"x\"", body);
        Assert.Contains("\"seatToken\"", body);
    }

    [Fact]
    public async Task Missing_capability_uses_contract_problem_shape()
    {
        var created = await client.PostAsJsonAsync("/api/v1/games", new { commandId = Guid.NewGuid() });
        var document = await created.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var gameId = document.GetProperty("game").GetProperty("id").GetString();
        var response = await client.PostAsJsonAsync($"/api/v1/games/{gameId}/resign",
            new { commandId = Guid.NewGuid(), expectedSequence = 1 });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        Assert.Equal("invalid_capability", problem.GetProperty("code").GetString());
        Assert.True(problem.TryGetProperty("traceId", out _));
    }
}
