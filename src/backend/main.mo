import Array "mo:core/Array";
import Order "mo:core/Order";
import List "mo:core/List";
import Text "mo:core/Text";

actor {
  type HighScoreEntry = {
    playerName : Text;
    score : Nat;
  };

  module HighScoreEntry {
    public func compare(entry1 : HighScoreEntry, entry2 : HighScoreEntry) : Order.Order {
      if (entry1.score > entry2.score) { return #less };
      if (entry1.score < entry2.score) { return #greater };
      Text.compare(entry1.playerName, entry2.playerName);
    };
  };

  let highScores = List.empty<HighScoreEntry>();

  public shared ({ caller }) func submitHighScore(playerName : Text, score : Nat) : async () {
    let newScore = { playerName; score };
    highScores.add(newScore);
  };

  public query ({ caller }) func getTopHighScores(limit : Nat) : async [HighScoreEntry] {
    let currentLimit = if (limit > 10) { 10 } else { limit };
    let sortedScores = highScores.toArray().sort();
    let size = sortedScores.size();
    if (size <= currentLimit) { return sortedScores };
    Array.tabulate(currentLimit, func(i) { sortedScores[i] });
  };
};
