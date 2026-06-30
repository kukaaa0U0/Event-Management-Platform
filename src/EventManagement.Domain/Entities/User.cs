using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Entities;

public sealed class User
{
    private User()
    {
    }

    public User(UserId id, string fullName, Email email, UserRole role)
    {
        Id = id;
        ChangeName(fullName);
        Email = email;
        Role = role;
    }

    public UserId Id { get; private set; }

    public string FullName { get; private set; } = string.Empty;

    public Email Email { get; private set; } = null!;

    public UserRole Role { get; private set; }

    public void ChangeName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Full name is required.", nameof(fullName));
        }

        FullName = fullName.Trim();
    }
}
