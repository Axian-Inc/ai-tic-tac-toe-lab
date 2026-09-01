namespace TicTacToe.Api.Tests;

public sealed class LambdaDeploymentTests
{
    [Fact]
    public void Delivery_seams_are_stable_and_repository_relative()
    {
        Assert.Equal("artifacts/lambda", LambdaDeployment.PublishDirectory);
        Assert.Equal("TicTacToe.Api", LambdaDeployment.HttpHandler);
        Assert.Equal(
            "TicTacToe.Api::TicTacToe.Api.WebSocketLambdaFunction::FunctionHandlerAsync",
            LambdaDeployment.WebSocketHandler);
        Assert.False(Path.IsPathRooted(LambdaDeployment.PublishDirectory));
    }
}
