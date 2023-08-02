const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};
initializeServer();

const playerDetailsToArrayObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const matchDetailsToArrayObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const playerMatchScoreToArrayObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//  a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const allPlayersQuery = `
    SELECT
    *
    FROM 
    player_details
    `;
  const allPlayersArray = await db.all(allPlayersQuery);
  response.send(allPlayersArray.map((i) => playerDetailsToArrayObject(i)));
});

//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const onePlayerQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId}
    `;
  const onePlayerArray = await db.get(onePlayerQuery);
  response.send(playerDetailsToArrayObject(onePlayerArray));
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name='${playerName}'
    WHERE
    player_id=${playerId}
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT match_id AS matchId,
    match,
    year
    FROM 
    match_details 
    WHERE 
    match_id=${matchId}
    `;
  const matchDetailsArray = await db.get(matchDetailsQuery);
  response.send(matchDetailsArray);
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const allMatchesOfPlayer = `
    SELECT 
    match_details.match_id as matchId,
    match_details.match,
    match_details.year
    FROM 
    player_match_score NATURAL JOIN match_details
    WHERE 
    player_id=${playerId}
    `;
  const allMatchesOfPlayerArray = await db.all(allMatchesOfPlayer);
  response.send(allMatchesOfPlayerArray);
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerOfSpecificMatch = `
    SELECT 
    player_details.player_id as playerId,
    player_details.player_name as playerName
    FROM player_details NATURAL JOIN player_match_score 
    WHERE player_match_score.match_id=${matchId}
    
    `;
  const array = await db.all(playerOfSpecificMatch);
  response.send(array);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_details NATURAL JOIN player_match_score 
    WHERE player_id=${playerId}

    `;
  const totalArray = await db.get(totalQuery);
  response.send(totalArray);
});

module.exports = app;
