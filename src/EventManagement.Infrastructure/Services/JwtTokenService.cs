using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EventManagement.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace EventManagement.Infrastructure.Services;

public sealed class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAtUtc) CreateToken(User user)
    {
        var issuer = GetRequiredSetting("Jwt:Issuer");
        var audience = GetRequiredSetting("Jwt:Audience");
        var secret = GetRequiredSetting("Jwt:Secret");
        var expirationMinutes = int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var configuredMinutes)
            ? configuredMinutes
            : 120;
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(expirationMinutes);

        var header = new Dictionary<string, object>
        {
            ["alg"] = "HS256",
            ["typ"] = "JWT"
        };

        var payload = new Dictionary<string, object>
        {
            ["sub"] = user.Id.Value.ToString(),
            ["name"] = user.FullName,
            ["email"] = user.Email.Value,
            ["role"] = user.Role.ToString(),
            ["iss"] = issuer,
            ["aud"] = audience,
            ["iat"] = now.ToUnixTimeSeconds(),
            ["exp"] = expiresAt.ToUnixTimeSeconds()
        };

        var encodedHeader = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(header));
        var encodedPayload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(payload));
        var unsignedToken = $"{encodedHeader}.{encodedPayload}";
        var signature = Sign(unsignedToken, secret);

        return ($"{unsignedToken}.{signature}", expiresAt.UtcDateTime);
    }

    private string GetRequiredSetting(string key)
    {
        return _configuration[key]
            ?? throw new InvalidOperationException($"Configuration value '{key}' is required.");
    }

    private static string Sign(string value, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(value)));
    }

    private static string Base64UrlEncode(byte[] value)
    {
        return Convert.ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
