import {
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import "./CardTable.css";

const BACKEND_URL =
   process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:3001";

const SUITS = [
  "♠",
  "♥",
  "♦",
  "♣",
];

const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function Card({
  card,
  onPointerDown,
  style,
}) {
  const isRed =
    card.suit === "♥" ||
    card.suit === "♦";

  return (
    <div
      className={`card ${isRed ? "red" : ""}`}
      style={style}
      onPointerDown={onPointerDown}
    >
      <div>{card.rank}</div>
      <div>{card.suit}</div>
    </div>
  );
}

function SetupScreen({
  onCreateGame,
  onBack,
}) {
  const [playerName, setPlayerName] =
    useState("");

  const [playerCount, setPlayerCount] =
    useState(2);

  const [selectedCards, setSelectedCards] =
    useState(() => {
      const result = {};

      SUITS.forEach((suit) => {
        RANKS.forEach((rank) => {
          result[`${suit}-${rank}`] = true;
        });
      });

      return result;
    });

  const [error, setError] = useState("");

  const toggleCard = (suit, rank) => {
    const key = `${suit}-${rank}`;

    setSelectedCards((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const selectSuit = (suit, selected) => {
    setSelectedCards((current) => {
      const next = {
        ...current,
      };

      RANKS.forEach((rank) => {
        next[`${suit}-${rank}`] = selected;
      });

      return next;
    });
  };

  const createGame = () => {
    setError("");

    if (!playerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    const playingCards = [];

    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        const key = `${suit}-${rank}`;

        if (selectedCards[key]) {
          playingCards.push({
            suit,
            rank,
          });
        }
      });
    });

    if (playingCards.length === 0) {
      setError("Select at least one card.");
      return;
    }

    if (playingCards.length % playerCount !== 0) {
      setError(
        `${playingCards.length} cards cannot be divided equally among ${playerCount} players.`
      );
      return;
    }

    onCreateGame({
      name: playerName.trim(),
      playerCount,
      playingCards,
    });
  };

  return (
    <div className="room-screen">
      <div className="setup-panel">
        <h1>Create Game</h1>

        <div className="setup-section">
          <label>Your name</label>

          <input
            value={playerName}
            onChange={(event) =>
              setPlayerName(event.target.value)
            }
            placeholder="Enter your name"
          />
        </div>

        <div className="setup-section">
          <label>Number of players</label>

          <div className="player-count-options">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                className={
                  playerCount === count
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setPlayerCount(count)
                }
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <div className="section-heading">
            <strong>Playing cards</strong>

            <span>
              Cards are distributed equally.
            </span>
          </div>

          {SUITS.map((suit) => {
            const allSelected = RANKS.every(
              (rank) =>
                selectedCards[
                  `${suit}-${rank}`
                ]
            );

            return (
              <div
                className="suit-section"
                key={suit}
              >
                <button
                  className={`suit-title ${
                    suit === "♥" ||
                    suit === "♦"
                      ? "red"
                      : ""
                  }`}
                  onClick={() =>
                    selectSuit(
                      suit,
                      !allSelected
                    )
                  }
                >
                  <span>{suit}</span>

                  <span>
                    {allSelected
                      ? "Deselect all"
                      : "Select all"}
                  </span>
                </button>

                <div className="card-selector">
                  {RANKS.map((rank) => {
                    const key =
                      `${suit}-${rank}`;

                    return (
                      <button
                        key={key}
                        className={`card-option ${
                          selectedCards[key]
                            ? "selected"
                            : ""
                        } ${
                          suit === "♥" ||
                          suit === "♦"
                            ? "red"
                            : ""
                        }`}
                        onClick={() =>
                          toggleCard(
                            suit,
                            rank
                          )
                        }
                      >
                        {rank}
                        {suit}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="room-error">
            {error}
          </div>
        )}

        <button
          className="create-game-button"
          onClick={createGame}
        >
          Create Game
        </button>

        <button
          className="back-button"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
}

function JoinScreen({
  onJoinGame,
  onBack,
}) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const joinGame = () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!roomId.trim()) {
      setError("Please enter the room ID.");
      return;
    }

    onJoinGame({
      name: name.trim(),
      roomId: roomId.trim().toUpperCase(),
    });
  };

  return (
    <div className="room-screen">
      <div className="setup-panel join-panel">
        <h1>Join Game</h1>

        <div className="setup-section">
          <label>Your name</label>

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter your name"
          />
        </div>

        <div className="setup-section">
          <label>Room ID</label>

          <input
            value={roomId}
            onChange={(event) =>
              setRoomId(event.target.value)
            }
            placeholder="Enter room ID"
          />
        </div>

        {error && (
          <div className="room-error">
            {error}
          </div>
        )}

        <button
          className="create-game-button"
          onClick={joinGame}
        >
          Join Game
        </button>

        <button
          className="back-button"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
}

function RoomScreen({
  onCreate,
  onJoin,
}) {
  return (
    <div className="room-screen">
      <h1>Card Game</h1>

      <button onClick={onCreate}>
        Create Game
      </button>

      <button onClick={onJoin}>
        Join Game
      </button>
    </div>
  );
}

function Player({
  player,
  position,
  isCurrent,
}) {
  if (position === "bottom") {
    return null;
  }

  return (
    <div
      className={`player ${position}-player`}
    >
      <div className="player-name">
        {player.name || "Waiting..."}

        {isCurrent && (
          <span className="you-label">
            {" "}
            (You)
          </span>
        )}
      </div>

      <div className="player-score">
        {player.score ?? 0}
      </div>

      <div className="opponent-hand">
        {player.cardCount > 0 ? (
          <div className="grouped-cards">
            <div className="stack-card stack-1" />
            <div className="stack-card stack-2" />

            <div className="stack-card stack-3">
              <span>
                {player.cardCount}
              </span>
            </div>
          </div>
        ) : (
          <span className="no-cards">
            No cards
          </span>
        )}
      </div>
    </div>
  );
}

function ScorePanel({
  players,
  onUpdateScore,
  onStartNewGame,
  scoreLogs,
}) {
  const [changes, setChanges] = useState({});
  const [reasons, setReasons] = useState({});

  const updateChange = (id, value) => {
    setChanges((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const updateReason = (id, value) => {
    setReasons((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const submitChange = (id) => {
    const change = Number(changes[id]);

    if (
      !Number.isFinite(change) ||
      change === 0
    ) {
      return;
    }

    onUpdateScore({
      targetPlayerId: id,
      change,
      reason: reasons[id] || "",
    });

    setChanges((current) => ({
      ...current,
      [id]: "",
    }));

    setReasons((current) => ({
      ...current,
      [id]: "",
    }));
  };

  return (
    <div className="score-panel">
      <div className="score-panel-header">
        <strong>Scores</strong>

        <button
          className="new-game-button"
          onClick={onStartNewGame}
        >
          Start New Game
        </button>
      </div>

      <div className="score-list">
        {players.map((player) => (
          <div
            className="score-row"
            key={player.id}
          >
            <div className="score-player-name">
              {player.name || "Waiting..."}
            </div>

            <div className="score-value">
              {player.score ?? 0}
            </div>

            <input
              className="score-change-input"
              type="number"
              placeholder="+/-"
              value={
                changes[player.id] ?? ""
              }
              onChange={(event) =>
                updateChange(
                  player.id,
                  event.target.value
                )
              }
            />

            <input
              className="score-reason-input"
              placeholder="Reason"
              value={
                reasons[player.id] ?? ""
              }
              onChange={(event) =>
                updateReason(
                  player.id,
                  event.target.value
                )
              }
            />

            <button
              className="score-update-button"
              onClick={() =>
                submitChange(player.id)
              }
            >
              Update
            </button>
          </div>
        ))}
      </div>

      <div className="score-log-section">
        <strong>Score Log</strong>

        <div className="score-log">
          {scoreLogs.length === 0 ? (
            <div className="empty-log">
              No score changes yet.
            </div>
          ) : (
            [...scoreLogs]
              .reverse()
              .map((log) => (
                <div
                  className="log-item"
                  key={log.id}
                >
                  <div>
                    <strong>
                      {log.changedByName}
                    </strong>{" "}
                    changed{" "}
                    <strong>
                      {log.targetPlayerName}
                    </strong>
                    's score
                  </div>

                  <div className="log-score">
                    {log.oldScore} →{" "}
                    {log.newScore} (
                    {log.change > 0
                      ? "+"
                      : ""}
                    {log.change})
                  </div>

                  {log.reason && (
                    <div className="log-reason">
                      {log.reason}
                    </div>
                  )}

                  <div className="log-time">
                    {new Date(
                      log.timestamp
                    ).toLocaleString()}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

function GameTable({
  roomId,
  playerId,
  onLeave,
}) {
  const [gameState, setGameState] =
    useState(null);

  const [showScores, setShowScores] =
    useState(false);

  const [dragging, setDragging] =
    useState(null);

  const socketRef = useRef(null);
  const boardRef = useRef(null);
  const handRef = useRef(null);

  /*
   * IMPORTANT:
   *
   * Do not use React state as the source of
   * truth while a pointer drag is happening.
   *
   * React state updates are asynchronous.
   *
   * This ref always contains the current
   * drag information, including offsetX/offsetY.
   */
  const draggingRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL);

    socketRef.current = socket;

    socket.emit("join-game", {
      roomId,
      playerId,
    });

    socket.on("game-state", (state) => {
      setGameState(state);
    });

    socket.on("error-message", (message) => {
      alert(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      draggingRef.current = null;
    };
  }, [roomId, playerId]);

  const startDrag = (
    event,
    card,
    source
  ) => {
    event.preventDefault();

    const element =
      event.currentTarget;

    const rect =
      element.getBoundingClientRect();

    const offsetX =
      event.clientX - rect.left;

    const offsetY =
      event.clientY - rect.top;

    const drag = {
      card,
      source,
      offsetX,
      offsetY,
      x: event.clientX,
      y: event.clientY,
    };

    /*
     * Store the actual drag object in a ref.
     * This value cannot become stale/null
     * between pointermove and pointerup.
     */
    draggingRef.current = drag;

    /*
     * State is only used to make the dragged
     * card visible on screen.
     */
    setDragging({
      ...drag,
    });

    const handleMove = (moveEvent) => {
      const currentDrag =
        draggingRef.current;

      if (!currentDrag) {
        return;
      }

      const updatedDrag = {
        ...currentDrag,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      };

      draggingRef.current =
        updatedDrag;

      setDragging({
        ...updatedDrag,
      });
    };

    const handleUp = (upEvent) => {
      document.removeEventListener(
        "pointermove",
        handleMove
      );

      document.removeEventListener(
        "pointerup",
        handleUp
      );

      const currentDrag =
        draggingRef.current;

      if (!currentDrag) {
        setDragging(null);
        return;
      }

      finishDrag(
        currentDrag,
        upEvent
      );

      draggingRef.current = null;
      setDragging(null);
    };

    document.addEventListener(
      "pointermove",
      handleMove
    );

    document.addEventListener(
      "pointerup",
      handleUp
    );
  };

  const finishDrag = (
    drag,
    event
  ) => {
    const board =
      boardRef.current;

    const hand =
      handRef.current;

    if (!board) {
      return;
    }

    /*
     * Read everything from the drag ref/object.
     * Never read offsetX/offsetY from React state.
     */
    const {
      card,
      source,
      offsetX,
      offsetY,
    } = drag;

    const boardRect =
      board.getBoundingClientRect();

    const handRect =
      hand?.getBoundingClientRect();

    const insideBoard =
      event.clientX >= boardRect.left &&
      event.clientX <= boardRect.right &&
      event.clientY >= boardRect.top &&
      event.clientY <= boardRect.bottom;

    const insideHand =
      handRect &&
      event.clientX >= handRect.left &&
      event.clientX <= handRect.right &&
      event.clientY >= handRect.top &&
      event.clientY <= handRect.bottom;

    /*
     * CARD FROM HAND
     *
     * It can ONLY be dropped on the board.
     */
    if (source === "hand") {
      if (!insideBoard) {
        return;
      }

      const x =
        event.clientX -
        boardRect.left -
        offsetX;

      const y =
        event.clientY -
        boardRect.top -
        offsetY;

      if (!socketRef.current) {
        return;
      }

      socketRef.current.emit(
        "play-card",
        {
          roomId,
          playerId,
          cardId: card.id,
          x,
          y,
        }
      );

      return;
    }

    /*
     * CARD ALREADY ON BOARD
     *
     * It can:
     * 1. Stay/move anywhere inside the board.
     * 2. Be dragged back to the player's hand.
     * 3. If dropped somewhere else, it stays
     *    at its previous server position.
     */
    if (source === "board") {
      if (insideHand) {
        if (!socketRef.current) {
          return;
        }

        socketRef.current.emit(
          "return-card",
          {
            roomId,
            playerId,
            cardId: card.id,
          }
        );

        return;
      }

      if (insideBoard) {
        const x =
          event.clientX -
          boardRect.left -
          offsetX;

        const y =
          event.clientY -
          boardRect.top -
          offsetY;

        if (!socketRef.current) {
          return;
        }

        socketRef.current.emit(
          "move-card",
          {
            roomId,
            cardId: card.id,
            x,
            y,
          }
        );

        return;
      }

      /*
       * Dropped outside both board and hand.
       *
       * Do nothing. Since the server never
       * received a move, the card remains at
       * its previous position.
       */
    }
  };

  const updateScore = ({
    targetPlayerId,
    change,
    reason,
  }) => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(
      "update-score",
      {
        roomId,
        playerId,
        targetPlayerId,
        change,
        reason,
      }
    );
  };

  const startNewGame = () => {
    const confirmed =
      window.confirm(
        "Start a new game? The cards will be shuffled and redistributed, and all scores will reset to 0."
      );

    if (!confirmed) {
      return;
    }

    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(
      "new-game",
      {
        roomId,
      }
    );
  };

  if (!gameState) {
    return (
      <div className="loading-screen">
        Connecting...
      </div>
    );
  }

  const currentIndex =
    gameState.players.findIndex(
      (player) =>
        player.id === playerId
    );

  const getPosition = (player) => {
    const relative =
      (player.id -
        currentIndex +
        gameState.players.length) %
      gameState.players.length;

    if (relative === 0) {
      return "bottom";
    }

    if (gameState.players.length === 2) {
      return "top";
    }

    if (gameState.players.length === 3) {
      return relative === 1
        ? "left"
        : "right";
    }

    if (relative === 1) {
      return "left";
    }

    if (relative === 2) {
      return "top";
    }

    return "right";
  };

  const currentPlayer =
    gameState.players.find(
      (player) =>
        player.id === playerId
    );

  return (
    <div className="game">
      <div className="room-info">
        <span>Room:</span>

        <strong>{roomId}</strong>

        <span>
          Game #{gameState.gameNumber}
        </span>

        <button
          onClick={() =>
            setShowScores(
              (current) => !current
            )
          }
        >
          Scores
        </button>

        <button onClick={onLeave}>
          Leave
        </button>
      </div>

      {showScores && (
        <ScorePanel
          players={gameState.players}
          onUpdateScore={updateScore}
          onStartNewGame={startNewGame}
          scoreLogs={
            gameState.scoreLogs || []
          }
        />
      )}

      {gameState.players.map(
        (player) => (
          <Player
            key={player.id}
            player={player}
            position={getPosition(
              player
            )}
            isCurrent={
              player.id === playerId
            }
          />
        )
      )}

      <div
        ref={boardRef}
        className="game-board"
      >
        {gameState.boardCards.map(
          (card) => (
            <Card
              key={card.id}
              card={card}
              style={{
                left: card.x,
                top: card.y,
              }}
              onPointerDown={(event) =>
                startDrag(
                  event,
                  card,
                  "board"
                )
              }
            />
          )
        )}
      </div>

      <div className="bottom-player">
        <div className="player-name">
          {currentPlayer?.name}

          <span className="you-label">
            {" "}
            (You)
          </span>

          <span className="my-score">
            {" "}
            Score:{" "}
            {currentPlayer?.score ?? 0}
          </span>
        </div>

        <div
          ref={handRef}
          className="hand"
        >
          {gameState.hand.map(
            (card) => (
              <Card
                key={card.id}
                card={card}
                onPointerDown={(event) =>
                  startDrag(
                    event,
                    card,
                    "hand"
                  )
                }
              />
            )
          )}
        </div>
      </div>

      {dragging && (
        <Card
          card={dragging.card}
          style={{
            position: "fixed",
            left:
              dragging.x -
              dragging.offsetX,
            top:
              dragging.y -
              dragging.offsetY,
            margin: 0,
            zIndex: 10000,
            pointerEvents: "none",
            transform:
              "rotate(4deg) scale(1.05)",
            boxShadow:
              "0 12px 25px rgba(0,0,0,0.45)",
          }}
        />
      )}
    </div>
  );
}

export default function CardTable() {
  const [screen, setScreen] =
    useState("room");

  const [roomId, setRoomId] =
    useState(null);

  const [playerId, setPlayerId] =
    useState(null);

  const createGame = async ({
    name,
    playerCount,
    playingCards,
  }) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/games`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            playerCount,
            playingCards,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to create game"
        );

        return;
      }

      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setScreen("game");
    } catch (error) {
      console.error(error);

      alert(
        "Could not connect to backend."
      );
    }
  };

  const joinGame = async ({
    name,
    roomId,
  }) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/games/${roomId}/join`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to join game"
        );

        return;
      }

      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setScreen("game");
    } catch (error) {
      console.error(error);

      alert(
        "Could not connect to backend."
      );
    }
  };

  if (screen === "create") {
    return (
      <SetupScreen
        onCreateGame={createGame}
        onBack={() =>
          setScreen("room")
        }
      />
    );
  }

  if (screen === "join") {
    return (
      <JoinScreen
        onJoinGame={joinGame}
        onBack={() =>
          setScreen("room")
        }
      />
    );
  }

  if (screen === "game") {
    return (
      <GameTable
        roomId={roomId}
        playerId={playerId}
        onLeave={() => {
          setRoomId(null);
          setPlayerId(null);
          setScreen("room");
        }}
      />
    );
  }

  return (
    <RoomScreen
      onCreate={() =>
        setScreen("create")
      }
      onJoin={() =>
        setScreen("join")
      }
    />
  );
}