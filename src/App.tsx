import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { shuffleInPlace } from './Utils';

const TARGET_DIGITS_LIMIT = 4;
const TARGET_TURN_LIMIT = 7;

function App() {
  const [gameMode, setGameMode] = useState<"MAN_PC" | "BOT_PC">();
  return (
    <>
      <h1>Number guesser game</h1>
      <p style={{fontSize: "smaller"}}>Open-sourced at: <a>https://github.com/qnhant5010/number-guesser</a></p>
      <p>Can you find a number of {TARGET_DIGITS_LIMIT} distinct digits in no more than {TARGET_TURN_LIMIT} turns ?</p>
      <div>
        <table style={{
          width: "100%"
        }}>
          <tbody>
            <tr>
              <td>
                <button onClick={() => setGameMode("MAN_PC")}>Man VS Machine</button>
              </td>
              <td>
                Find the machine's number
              </td>
            </tr>
            <tr>
              <td>
                <button onClick={() => setGameMode("BOT_PC")}>Bot VS Machine</button>
              </td>
              <td>
                Create a bot to find the machine's number
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {
        gameMode === "MAN_PC" &&
        <div className="card">
          <GameOfMan key="MAN_PC" />
        </div>
        || gameMode === "BOT_PC" &&
        <div className="card">
          <GameOfBot key="BOT_PC" />
        </div>
        || <h3>Please select a game mode</h3>
      }
    </>
  )
}

export default App;

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
const DIGIT_ALPHABET = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) as Set<Digit>;
const generateTarget = (requiredLength: number): Digit[] => {
  if (requiredLength > DIGIT_ALPHABET.size) throw new TypeError("Exceeding size of DIGIT_ALPHABET. The length must be less than or equal to " + DIGIT_ALPHABET.size);
  return shuffleInPlace(Array.from(DIGIT_ALPHABET)).slice(0, 4);
}

/**
 * Each turn, user guesses a number, and we check it against the target, recording the result:
 * 1. how many digits are correct and at correct places
 * 2. how many digits are correct but not at correct places
 */
type Guess = {
  value: Digit[]
}

type TurnResult = {
  digitsRightPlaced: number,
  digitsMisplaced: number
}

type Turn = {
  guess: Guess,
  result: TurnResult
}

type GameResult = "W" | "L";

const GameOfMan = () => {
  const [target, setTarget] = useState(() => generateTarget(TARGET_DIGITS_LIMIT));
  const [turnHistory, setTurnHistory] = useState<Turn[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  useEffect(() => {
    console.groupCollapsed("SECRET !!!");
    console.log("TARGET = %s", target.join(" "));
    console.groupEnd();
  }, [target]);

  const onSubmitGuess = useCallback((guess: Digit[]) => {
    const turnResult = evaluateGuess(guess, target);
    setTurnHistory(turnHistory => turnHistory.concat({
      guess: {
        value: guess
      },
      result: turnResult
    }))
    if (isWinner(target, turnResult)) setGameResult("W");
  }, [target]);

  const onRestartGame = useCallback(() => {
    setTarget(generateTarget(TARGET_DIGITS_LIMIT));
    setTurnHistory([]);
    setGameResult(null);
  }, [setTarget]);

  return (
    <div>
      <TurnHistoryDisplayer turnHistory={turnHistory} />
      <br />
      {
        gameResult === "W" ? <h1>YOU WIN!</h1>
          : isLoser(turnHistory) ? <p>
            <h1>YOU LOSE!</h1>
            <span>Answer = <b>{target.join(" ")}</b></span>
          </p>
            : <GuessInput requiredLength={target.length} onSubmit={onSubmitGuess} />
      }
      <br />
      <button onClick={onRestartGame}>New game</button>
    </div>
  )
}

const evaluateGuess = (guess: Digit[], target: Digit[]): TurnResult => {
  return {
    digitsRightPlaced: guess.reduce((currentCount, currentDigit, currentDigitIdx) => currentCount += (currentDigit === target[currentDigitIdx] ? 1 : 0), 0),
    // We don't check if duplicate
    digitsMisplaced: guess.reduce((currentCount, currentDigit, currentDigitIdx) => currentCount += (target[currentDigitIdx] !== currentDigit && target.includes(currentDigit) ? 1 : 0), 0)
  }
}


const isWinner = (target: Digit[], result: TurnResult): boolean => result.digitsRightPlaced === target.length && result.digitsMisplaced === 0;

/**
 * Should only be called after checking is not winner
 */
const isLoser = (turnHistory: Turn[]) => turnHistory.length >= TARGET_TURN_LIMIT;

type GuessValidation = {
  incorrectLength: boolean,
  unknownDigit: boolean
  duplicateDigit: boolean,
}

/**
 * Check for multiple critieria : length, valid digit, unique digit
 */
const validateGuess = (inputString: string, requiredLength: number): GuessValidation => {
  const incorrectLength = requiredLength !== inputString.length;
  const chars = inputString.split("");
  let unknownDigit = false;
  let duplicateDigit = false;
  const existingDigits = new Set() as Set<Digit>;
  for (let charIdx = 0; charIdx < chars.length; charIdx++) {
    const char = chars[charIdx] as Digit;
    if (!DIGIT_ALPHABET.has(char)) unknownDigit = true;
    if (existingDigits.has(char)) duplicateDigit = true; else existingDigits.add(char);
    if (unknownDigit && duplicateDigit) break; // No need to check anymore
  }
  return { incorrectLength, unknownDigit, duplicateDigit };
}

const isValidGuess = (validation: GuessValidation): boolean => !validation.incorrectLength && !validation.unknownDigit && !validation.duplicateDigit;

const GuessInput = (props: {
  requiredLength: number,
  onSubmit: (value: Digit[]) => void
}) => {
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const validation = validateGuess(currentGuess, props.requiredLength);

  return (
    <div id="guessing">
      <input placeholder="Enter a valid value" maxLength={props.requiredLength} type="text" id="guess" value={currentGuess} onChange={e => setCurrentGuess(e.target.value)} />
      <ol>
        <li key={"exceedLength"}>The length must be exactly {props.requiredLength} : <ConditionDisplayer value={!validation.incorrectLength} /></li>
        <li key={"unknownDigit"}>Only digits from <b>0</b> to <b>9</b> : <ConditionDisplayer value={!validation.unknownDigit} /></li>
        <li key={"duplicateDigit"}>Every digit ought to be different : <ConditionDisplayer value={!validation.duplicateDigit} /></li>
      </ol>
      <button disabled={!isValidGuess(validation)} onClick={() => { props.onSubmit(currentGuess.split("") as Digit[]); setCurrentGuess("") }}>Try</button>
    </div>
  )
}

const ConditionDisplayer = (props: {
  value: boolean
}) => props.value ? <span className="condition ok">&#10003;</span> : <span className="condition nok">&#10060;</span>;

const TurnHistoryDisplayer = (props: {
  turnHistory: Turn[]
}) => {
  return <div id="turn-history">
    <table className="turn-history-table" style={{
      width: "100%"
    }}>
      <thead>
        <tr>
          <th>
            N°
          </th>
          <th>
            Your guesses
          </th>
          <th>
            In place
          </th>
          <th>
            Misplaced
          </th>
        </tr>
      </thead>
      <tbody>
        {props.turnHistory.map((t, idx) => (
          <tr key={idx}>
            <td key={"turn-id"}>
              {idx + 1}
            </td>
            <td key={"guess"}>
              {t.guess.value.join(" ")}
            </td>
            <td key={"right-placed"}>
              {t.result.digitsRightPlaced}
            </td>
            <td key={"misplaced"}>
              {t.result.digitsMisplaced}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>;
};

const GameOfBot = () => {
  return <div>
    TODO
  </div>
}