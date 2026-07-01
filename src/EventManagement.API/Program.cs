using EventManagement.Infrastructure;
using EventManagement.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (builder.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    await app.Services.MigrateAndSeedDatabaseAsync();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
