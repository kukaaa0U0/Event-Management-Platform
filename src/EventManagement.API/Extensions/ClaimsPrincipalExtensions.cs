using System.Security.Claims;

namespace EventManagement.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue("sub")
            ?? throw new InvalidOperationException("Authenticated user id claim is missing.");

        return Guid.Parse(value);
    }

    public static string GetUserRole(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue("role")
            ?? throw new InvalidOperationException("Authenticated user role claim is missing.");
    }
}
