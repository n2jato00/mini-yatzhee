import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, Button } from "react-native";
import Header from "./Header";
import Footer from "./Footer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCOREBOARD_KEY } from "../constants/Game"
import style from "../style/style";

const Scoreboard = ({ navigation }) => {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      getScoreBoardData();
    });
    return unsubscribe;
  }, [navigation]);

  const getScoreBoardData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SCOREBOARD_KEY)
      if (jsonValue !== null) {
        let tmpScores = JSON.parse(jsonValue);
        setScores(tmpScores);
        // Sort results here for rendering, löytyy assignment ohjeesta
      }
    } catch (error) {
      console.log("read errror" + error.message);
    }
  }

  const resetScoreboard = async () => {
    try {
      // Tyhjennä pistetaulukko
      await AsyncStorage.removeItem(SCOREBOARD_KEY);
      console.log("Scoreboard reset successfully.");
      // Päivitä pistetaulukon tila tyhjäksi
      setScores([]);
    } catch (error) {
      console.log("Reset error: " + error.message);
    }
  };

  return (
    <ScrollView>
      <Header />
      <View>
        {scores.map((player, i) => (
          <Text style={style.results} key={i}>{i + 1}. {player.name} {player.date} {player.time} {player.points}</Text>
        ))}
        <Button
          color={"#F0A04B"}
          title="Reset Scoreboard"
          onPress={() => resetScoreboard()}
        />
      </View>
      <Footer />
    </ScrollView>
  );
};

export default Scoreboard;
