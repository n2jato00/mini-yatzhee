import React, { useState, useEffect } from "react";
import { Text, View, Pressable, Button } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Col, Grid } from "react-native-easy-grid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import style from "../style/style";
import {
  NBR_OF_DICES,
  NBR_OF_THROWS,
  MAX_SPOT,
  SCOREBOARD_KEY,
  MIN_SPOT,
  BONUS_POINT_LIMIT,
  BONUS_POINTS,
  NBR_OF_SCOREBOARD_ROWS,
} from "../constants/Game";

let board = []
let allowThrow = true;

const Gameboard = ({ route }) => {
  const [playerName, setPlayerName] = useState("");
  const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);
  const [status, setStatus] = useState("");
  const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));
  const [diceSpots, setDiceSpots] = useState(new Array(NBR_OF_DICES).fill(0));
  const [dicePointsTotal, setDicePointsTotal] = useState(new Array(MAX_SPOT).fill(0));
  const [selectedDicePoints, setSelectedDicePoints] = useState(new Array(MAX_SPOT).fill(false));
  const [scores, setScores] = useState([]);
  const [sum, setSum] = useState(0);



  const row = [];
  for (let i = 0; i < NBR_OF_DICES; i++) {
    row.push(
      <Col key={"row" + i}>
        <Pressable
          key={"row" + i}
          onPress={() => selectDice(i)}
        >
          <MaterialCommunityIcons
            name={board[i]}
            key={"row" + i}
            size={50}
            color={getDiceColor(i)}
          />
        </Pressable>
      </Col>
    );
  }

  const pointsRow = [];
  for (let spot = 0; spot < MAX_SPOT; spot++) {
    pointsRow.push(
      <Col key={"points" + spot}>
        <Text key={"points" + spot} style={style.points}>{getSpotTotal(spot)}</Text>
      </Col>
    );
  }

  const buttonsRow = [];
  for (let diceButton = 0; diceButton < MAX_SPOT; diceButton++) {
    buttonsRow.push(
      <Col key={"buttonsRow" + diceButton}>
        <Pressable
          onPress={() => selectDicePoints(diceButton)}
          key={"buttonsRow" + diceButton}
        >
          <MaterialCommunityIcons
            name={`numeric-${diceButton + 1}-circle`}
            key={"buttonsRow" + diceButton}
            size={40}
            color={getDicePointsColor(diceButton)}
          />
        </Pressable>
      </Col>
    );
  }

  useEffect(() => {
    if (playerName === "" && route.params?.player) {
      setPlayerName(route.params.player);
      getScoreBoardData();
    }
  }, []);

  useEffect(() => {
    checkWinner(); 
    if (selectedDicePoints.every(x => x)) {
      savePlayerPoints();
      setStatus("Game over! Choose new game to play again!");
    } else if (nbrOfThrowsLeft === 0) {
      // Suoritetaan, jos heittojen määrä on nolla
    } else if (nbrOfThrowsLeft < 0) {
      setNbrOfThrowsLeft(NBR_OF_THROWS - 1);
    }
  }, [nbrOfThrowsLeft]);
  

  function getDiceColor(i) {
    return selectedDices[i] ? "#183A1D" : "#F0A04B";
  }

  function getDicePointsColor(i) {
    return selectedDicePoints[i] ? "black" : "steelblue";
  }

  function selectDice(i) {
    if(allowThrow === true){
    const dices = [...selectedDices];
    dices[i] = !selectedDices[i];
    setSelectedDices(dices);
  }
}

  function getSpotTotal(i) {
    return dicePointsTotal[i];
  }

  function selectDicePoints(i) {
    if (allowThrow === true) {
    let selected = [...selectedDices];
    let selectedPoints = [...selectedDicePoints];
    let points = [...dicePointsTotal];
    if (!selectedPoints[i]) {
      selectedPoints[i] = true;
      let nbrOfDices = diceSpots.reduce((total, x) => (x === (i + 1) ? total + 1 : total), 0);
      points[i] = nbrOfDices * (i + 1);
      setDicePointsTotal(points);
      calculateSum(points); // Calculate sum after updating points
    }
    selected.fill(false);
    setSelectedDices(selected);
    setSelectedDicePoints(selectedPoints);
    setNbrOfThrowsLeft(NBR_OF_THROWS);
    allowThrow = false;
    return points[i];
    
  }
  }
  function calculateSum(points) {
    let total = points.reduce((acc, curr) => acc + curr, 0);
    // Check if the total sum exceeds the bonus point limit
    if (total > BONUS_POINT_LIMIT) {
      // Add bonus points
      total += BONUS_POINTS;
    }
    setSum(total);
  }
  const checkWinner = () => {
    if (nbrOfThrowsLeft === 0) {
      setStatus("Round over. Choose your points!");
    } else if (nbrOfThrowsLeft > 0) {
      setStatus("Keep throwing!");
    }
  };
  

  function throwDices() {
    if (nbrOfThrowsLeft > 0) {
      allowThrow = true;
      const spots = [...diceSpots];
      for (let i = 0; i < NBR_OF_DICES; i++) {
        if (!selectedDices[i]) {
          const randomNumber = Math.floor(Math.random() * 6 + 1);
          board[i] = `dice-${randomNumber}`;
          spots[i] = randomNumber;
        }
      }
      setNbrOfThrowsLeft(nbrOfThrowsLeft - 1);
      setDiceSpots(spots);
    }
  }

  const getScoreBoardData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SCOREBOARD_KEY);
      if (jsonValue !== null) {
        const tmpScores = JSON.parse(jsonValue);
        setScores(tmpScores);
      }
    } catch (error) {
      console.log("Read error: " + error.message);
    }
  };

  const savePlayerPoints = async () => {
    const playerPoints = {
      name: "PLAYER: " + playerName + "      ",
      date: new Date().toLocaleDateString() + "      ",
      points: sum,
    };
  
    try {
      // Retrieve existing scoreboard from AsyncStorage
      const jsonValue = await AsyncStorage.getItem(SCOREBOARD_KEY);
      let newScore = [];
  
      if (jsonValue !== null) {
        // Parse existing scoreboard if it exists
        newScore = JSON.parse(jsonValue);
      }
  
      // Sort the scoreboard by points in descending order
      newScore.sort((a, b) => {
        return b.points - a.points;
      });
  
      if (newScore.length >= NBR_OF_SCOREBOARD_ROWS) {
        const lowestScore = newScore[NBR_OF_SCOREBOARD_ROWS - 1].points;
        if (sum > lowestScore) {
          // Replace the lowest score with the new score
          newScore[NBR_OF_SCOREBOARD_ROWS - 1] = playerPoints;
        }
      } else {
        // Add the new player points
        newScore.push(playerPoints);
      }
  
      // Sort the scoreboard again after potentially replacing the lowest score
      newScore.sort((a, b) => {
        return b.points - a.points;
      });
  
      // Limit the scoreboard to NBR_OF_SCOREBOARD_ROWS rows if necessary
      if (newScore.length > NBR_OF_SCOREBOARD_ROWS) {
        newScore = newScore.slice(0, NBR_OF_SCOREBOARD_ROWS);
      }
  
      // Save the updated scoreboard back to AsyncStorage
      await AsyncStorage.setItem(SCOREBOARD_KEY, JSON.stringify(newScore));
    } catch (error) {
      console.log("Save error: " + error.message);
    }
  };
  
 
  
  
  

  const startNewGame = () => {
    setSelectedDices(new Array(NBR_OF_DICES).fill(false));
    setDiceSpots(new Array(NBR_OF_DICES).fill(0));
    setDicePointsTotal(new Array(MAX_SPOT).fill(0));
    setSelectedDicePoints(new Array(MAX_SPOT).fill(false));
    setScores([]);
    setNbrOfThrowsLeft(NBR_OF_THROWS);
    setSum(0);
    setStatus("");
    board = []

  };

  return (
    <View style={style.gameboard}>
      <View style={style.flex}>{row}</View>
      <Text style={style.gameinfo}>Throws left: {nbrOfThrowsLeft}</Text>
      <Text style={style.gameinfo}>{status}</Text>
      <View style={{ margin: 20 }}>
        <Button
          color={"#F0A04B"}
          title="THROW DICES"
          onPress={() => throwDices()}
          disabled={nbrOfThrowsLeft === 0 || selectedDicePoints.every(x => x)}
        />

      </View>

      <View style={style.dicePoints}>
        <Grid>{pointsRow}</Grid>
      </View>
      <View style={style.dicePoints}>
        <Grid>{buttonsRow}</Grid>
      </View>
      <Text style={style.gameinfo}>Total points: {sum}</Text>
      <Text style={style.playerNameText}>Player: {playerName}</Text>
      <View style={{ margin: 20 }}>
        <Button
          color={"#F0A04B"}
          title="Start New Game"
          onPress={() => startNewGame()}
        />
      </View>


    </View>
  );
};

export default Gameboard;

