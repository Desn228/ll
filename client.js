//var Color = importNamespace('PixelCombats.ScriptingApi.Structures');
//var System = importNamespace('System');

// константы
var WaitingPlayersTime = 10;
var GameModeTime = 600;
var EndOfMatchTime = 10;

// константы имен
var WaitingStateValue = "Waiting";
var BuildModeStateValue = "BuildMode";
var GameStateValue = "Game";
var EndOfMatchStateValue = "EndOfMatch";

// посто€нные переменные
var mainTimer = Timers.GetContext().Get("Main");
var stateProp = Properties.GetContext().Get("State");

// примен€ем параметры создани€ комнаты
Damage.FriendlyFire = GameMode.Parameters.GetBool("FriendlyFire");
Map.Rotation = GameMode.Parameters.GetBool("MapRotation");
BreackGraph.OnlyPlayerBlocksDmg = GameMode.Parameters.GetBool("PartialDesruction");
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool("LoosenBlocks");

// блок игрока всегда усилен
BreackGraph.PlayerBlockBoost = true;

// параметры игры
Properties.GetContext().GameModeName.Value = "GameModes/Team Dead Match";
TeamsBalancer.IsAutoBalance = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;
// создаем команды
Teams.Add("Special Forces "{ f: 1 });
Teams.Add("Terrorists " { r: 1 });
var blueTeam = Teams.Get("Special Forces");
var redTeam = Teams.Get("Terrorists");
blueTeam.Spawns.SpawnPointsGroups.Add(1);
redTeam.Spawns.SpawnPointsGroups.Add(2);
blueTeam.Build.BlocksSet.Value = BuildBlocksSet.Blue;
redTeam.Build.BlocksSet.Value = BuildBlocksSet.Red;

// задаем что выводить в лидербордах
LeaderBoard.PlayerLeaderBoardValues = [
{
Value: "Kills",
DisplayName: "Statistics/Kills",
ShortDisplayName: "Statistics/KillsShort"
},
{
Value: "Deaths",
DisplayName: "Statistics/Deaths",
ShortDisplayName: "Statistics/DeathsShort"
},
{
Value: "Spawns",
DisplayName: "Statistics/Spawns",
ShortDisplayName: "Statistics/SpawnsShort"
},
{
Value: "Scores",
DisplayName: "Statistics/Scores",
ShortDisplayName: "Statistics/ScoresShort"
}
];
LeaderBoard.TeamLeaderBoardValue = {
Value: "Deaths",
DisplayName: "Statistics\Deaths",
ShortDisplayName: "Statistics\Deaths"
};
// вес команды в лидерборде
LeaderBoard.TeamWeightGetter.Set(function(team) {
return team.Properties.Get("Deaths").Value;
});
// вес игрока в лидерборде
LeaderBoard.PlayersWeightGetter.Set(function(player) {
return player.Properties.Get("Kills").Value;
});

// разрешаем вход в команды по запросу
Teams.OnRequestJoinTeam.Add(function(player,team){team.Add(player);});
// спавн по входу в команду
Teams.OnPlayerChangeTeam.Add(function(player){ player.Spawns.Spawn()});

// делаем игроков неуязвимыми после спавна
var immortalityTimerName="immortality";
Spawns.GetContext().OnSpawn.Add(function(player){
player.Properties.Immortality.Value=true;
timer=player.Timers.Get(immortalityTimerName).Restart(5);
});
Timers.OnPlayerTimer.Add(function(timer){
if(timer.Id!=immortalityTimerName) return;
timer.Player.Properties.Immortality.Value=false;
});

// счетчик спавнов
Spawns.OnSpawn.Add(function(player) {
++player.Properties.Spawns.Value;
});
// счетчик смертей
Damage.OnDeath.Add(function(player) {
++player.Properties.Deaths.Value;
});

// счетчик убийств
Damage.OnKill.Add(function(player, killed) {
if (killed.Team != null && killed.Team != player.Team) {
++player.Properties.Kills.Value;
player.Properties.Scores.Value += 100;
}
});

// настройка переключени€ режимов
mainTimer.OnTimer.Add(function() {
switch (stateProp.Value) {
case WaitingStateValue:
SetBuildMode();
break;
case BuildModeStateValue:
SetGameMode();
break;
case GameStateValue:
SetEndOfMatchMode();
break;
case EndOfMatchStateValue:
RestartGame();
break;
}
});

// задаем первое игровое состо€ние
SetWaitingMode();

// состо€ни€ игры
function SetWaitingMode() {
stateProp.Value = WaitingStateValue;
Ui.GetContext().Hint.Value = "Hint/WaitingPlayers";
Spawns.GetC
ontext().enable = false;
mainTimer.Restart(WaitingPlayersTime);
}

function SetBuildMode()
{
stateProp.Value = BuildModeStateValue;
Ui.GetContext().Hint.Value = "Hint/BuildBase";
var inventory = Inventory.GetContext();
inventory.Main.Value = false;
inventory.Secondary.Value = false;
inventory.Melee.Value = true;
inventory.Explosive.Value = false;
inventory.Build.Value = false;

mainTimer.Restart(BuildBaseTime);
Spawns.GetContext().enable = false;
SpawnTeams();
}
function SetGameMode()
{
stateProp.Value = GameStateValue;
Ui.GetContext().Hint.Value = "Hint/AttackEnemies";

var inventory = Inventory.GetContext();
if (GameMode.Parameters.GetBool("OnlyKnives")) {
inventory.Main.Value = false;
inventory.Secondary.Value = false;
inventory.Melee.Value = true;
inventory.Explosive.Value = false;
inventory.Build.Value = false;
} else {
inventory.Main.Value = true;
inventory.Secondary.Value = true;
inventory.Melee.Value = true;
inventory.Explosive.Value = false;
inventory.Build.Value = false;
}

mainTimer.Restart(GameModeTime);
Spawns.GetContext().Despawn();
SpawnTeams();
}
function SetEndOfMatchMode() {
stateProp.Value = EndOfMatchStateValue;
Ui.GetContext().Hint.Value = "Hint/EndOfMatch";

var spawns = Spawns.GetContext();
spawns.enable = false;
spawns.Despawn();
Game.GameOver(LeaderBoard.GetTeams());
mainTimer.Restart(EndOfMatchTime);
}
function RestartGame() {
Game.RestartGame();
}

function SpawnTeams() {
var e = Teams.GetEnumerator();
while (e.moveNext()) {
Spawns.GetContext(e.Current).Spawn();
}
}
