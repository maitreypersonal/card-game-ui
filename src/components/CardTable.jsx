import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./CardTable.css";

const BACKEND_URL = "http://localhost:3001";

function Card({
  card,
  onPointerDown,
  dragging = false,
  dragX,
  dragY,
  style
}) {
  if (!card) {
    return null;
  }

  return (
    <div
      className={`card ${
        card.suit === "♥" ||
        card.suit === "♦"
          ? "red"
          : ""
      } ${
        dragging
          ? "dragging-card"
          : ""
      }`}
      onPointerDown={onPointerDown}
      style={
        dragging
          ? {
              left: dragX,
              top: dragY
            }
          : style
      }
    >
      <div>{card.rank}</div>
      <div>{card.suit}</div>
    </div>
  );
}

/* =========================
   ROOM SCREEN
========================= */

function RoomScreen({
  onConnected
}) {
  const [roomId, setRoomId] =
    useState("");

  const [playerName, setPlayerName] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const createGame =
    async () => {
      const name =
        playerName.trim();

      if (!name) {
        setError(
          "Please enter your name"
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${BACKEND_URL}/api/games`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                name
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to create game"
          );
        }

        onConnected(data);
      } catch (err) {
        setError(
          err.message ||
            "Failed to create game"
        );
      } finally {
        setLoading(false);
      }
    };

  const joinGame =
    async () => {
      const id =
        roomId
          .trim()
          .toUpperCase();

      const name =
        playerName.trim();

      if (!name) {
        setError(
          "Please enter your name"
        );
        return;
      }

      if (!id) {
        setError(
          "Please enter a room ID"
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${BACKEND_URL}/api/games/${id}/join`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                name
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to join game"
          );
        }

        onConnected(data);
      } catch (err) {
        setError(
          err.message ||
            "Failed to join game"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="room-screen">
      <h1>Card Game</h1>

      <input
        value={playerName}
        onChange={(event) =>
          setPlayerName(
            event.target.value
          )
        }
        placeholder="Enter your name"
        maxLength={20}
      />

      <button
        onClick={createGame}
        disabled={loading}
      >
        Create Game
      </button>

      <div className="room-divider">
        OR
      </div>

      <input
        value={roomId}
        onChange={(event) =>
          setRoomId(
            event.target.value
          )
        }
        placeholder="Enter Room ID"
        maxLength={6}
      />

      <button
        onClick={joinGame}
        disabled={loading}
      >
        Join Game
      </button>

      {error && (
        <div className="room-error">
          {error}
        </div>
      )}
    </div>
  );
}

/* =========================
   PLAYER
========================= */

function Player({
  player,
  isCurrentPlayer,
  hand,
  handRef,
  onHandPointerDown
}) {
  return (
    <div className="player">
      <div className="player-name">
        {player.name}

        {isCurrentPlayer && (
          <span className="you-label">
            {" "}
            (You)
          </span>
        )}
      </div>

      {isCurrentPlayer ? (
        <div
          ref={handRef}
          className="hand"
        >
          {hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              onPointerDown={(event) =>
                onHandPointerDown(
                  event,
                  card
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="opponent-hand">
          <div className="grouped-cards">
            <div className="stack-card stack-1" />
            <div className="stack-card stack-2" />

            <div className="stack-card stack-3">
              <span>
                {player.cardCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   GAME TABLE
========================= */

function GameTable({
  gameData,
  socket
}) {
  const [players, setPlayers] =
    useState([]);

  const [myHand, setMyHand] =
    useState([]);

  const [boardCards, setBoardCards] =
    useState([]);

  const [error, setError] =
    useState("");

  const [dragging, setDragging] =
    useState(null);

  const boardRef =
    useRef(null);

  const handRef =
    useRef(null);

  /* =========================
     RECEIVE GAME STATE
  ========================= */

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleGameState =
      (state) => {
        setPlayers(
          state.players || []
        );

        setMyHand(
          state.myHand || []
        );

        setBoardCards(
          state.boardCards || []
        );
      };

    const handleError =
      (message) => {
        setError(message);
      };

    socket.on(
      "game-state",
      handleGameState
    );

    socket.on(
      "error-message",
      handleError
    );

    return () => {
      socket.off(
        "game-state",
        handleGameState
      );

      socket.off(
        "error-message",
        handleError
      );
    };
  }, [socket]);

  /* =========================
     FIND PLAYERS
  ========================= */

  const currentPlayer =
    players.find(
      (player) =>
        player.id ===
        gameData.player.id
    );

  const otherPlayers =
    players.filter(
      (player) =>
        player.id !==
        gameData.player.id
    );

  const topPlayer =
    otherPlayers.find(
      (player) =>
        player.id ===
        (gameData.player.id + 2) % 4
    );

  const leftPlayer =
    otherPlayers.find(
      (player) =>
        player.id ===
        (gameData.player.id + 3) % 4
    );

  const rightPlayer =
    otherPlayers.find(
      (player) =>
        player.id ===
        (gameData.player.id + 1) % 4
    );

  /* =========================
     START DRAG FROM HAND
  ========================= */

  const handleHandPointerDown =
    (event, card) => {
      event.preventDefault();

      setDragging({
        source: "hand",
        card,
        x: event.clientX,
        y: event.clientY
      });
    };

  /* =========================
     START DRAG FROM BOARD
  ========================= */

  const handleBoardPointerDown =
    (event, card) => {
      event.preventDefault();

      setDragging({
        source: "board",
        card,
        x: event.clientX,
        y: event.clientY
      });
    };

  /* =========================
     DRAGGING
  ========================= */

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove =
      (event) => {
        setDragging(
          (current) => {
            if (!current) {
              return null;
            }

            return {
              ...current,
              x: event.clientX,
              y: event.clientY
            };
          }
        );
      };

    const handlePointerUp =
      (event) => {
        const board =
          boardRef.current?.getBoundingClientRect();

        const hand =
          handRef.current?.getBoundingClientRect();

        /* =========================
           CHECK BOARD DROP
        ========================= */

        const droppedOnBoard =
          board &&
          event.clientX >=
            board.left &&
          event.clientX <=
            board.right &&
          event.clientY >=
            board.top &&
          event.clientY <=
            board.bottom;

        /* =========================
           CHECK HAND DROP
        ========================= */

        const droppedOnHand =
          hand &&
          event.clientX >=
            hand.left &&
          event.clientX <=
            hand.right &&
          event.clientY >=
            hand.top &&
          event.clientY <=
            hand.bottom;

        /* =========================
           HAND -> BOARD
        ========================= */

        if (
          dragging.source ===
            "hand" &&
          droppedOnBoard
        ) {
          /*
           * IMPORTANT:
           *
           * Convert screen coordinates
           * into coordinates relative
           * to the game board.
           */

          const x =
            event.clientX -
            board.left -
            32;

          const y =
            event.clientY -
            board.top -
            47;

          socket.emit(
            "play-card",
            {
              cardId:
                dragging.card.id,
              x,
              y
            }
          );

          setDragging(null);
          return;
        }

        /* =========================
           BOARD -> MY HAND
        ========================= */

        if (
          dragging.source ===
            "board" &&
          droppedOnHand
        ) {
          socket.emit(
            "return-card",
            {
              cardId:
                dragging.card.id
            }
          );

          setDragging(null);
          return;
        }

        /* =========================
           BOARD -> BOARD
        ========================= */

        if (
          dragging.source ===
            "board" &&
          droppedOnBoard
        ) {
          /*
           * Again convert from
           * screen coordinates to
           * board-relative coordinates.
           */

          const x =
            event.clientX -
            board.left -
            32;

          const y =
            event.clientY -
            board.top -
            47;

          socket.emit(
            "move-card",
            {
              cardId:
                dragging.card.id,
              x,
              y
            }
          );

          setDragging(null);
          return;
        }

        /*
         * Dropped outside a valid
         * destination.
         */
        setDragging(null);
      };

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );
    };
  }, [
    dragging,
    socket
  ]);

  return (
    <div className="game">

      {/* =========================
          ROOM INFO
      ========================= */}

      <div className="room-info">
        <span>
          Room:
        </span>

        <strong>
          {gameData.roomId}
        </strong>

        <span>
          You:{" "}
          {gameData.player.name}
        </span>
      </div>

      {error && (
        <div className="game-error">
          {error}
        </div>
      )}

      {/* =========================
          BOARD
      ========================= */}

      <div
        ref={boardRef}
        className="game-board"
      >
        {boardCards.map(
          (card) => (
            <Card
              key={card.id}
              card={card}
              onPointerDown={(event) =>
                handleBoardPointerDown(
                  event,
                  card
                )
              }
              style={{
                left: card.x,
                top: card.y
              }}
            />
          )
        )}
      </div>

      {/* =========================
          TOP PLAYER
      ========================= */}

      {topPlayer && (
        <div className="top-player">
          <Player
            player={topPlayer}
            isCurrentPlayer={false}
            hand={[]}
            onHandPointerDown={() => {}}
          />
        </div>
      )}

      {/* =========================
          LEFT PLAYER
      ========================= */}

      {leftPlayer && (
        <div className="left-player">
          <Player
            player={leftPlayer}
            isCurrentPlayer={false}
            hand={[]}
            onHandPointerDown={() => {}}
          />
        </div>
      )}

      {/* =========================
          RIGHT PLAYER
      ========================= */}

      {rightPlayer && (
        <div className="right-player">
          <Player
            player={rightPlayer}
            isCurrentPlayer={false}
            hand={[]}
            onHandPointerDown={() => {}}
          />
        </div>
      )}

      {/* =========================
          CURRENT PLAYER
      ========================= */}

      {currentPlayer && (
        <div className="bottom-player">
          <Player
            player={currentPlayer}
            isCurrentPlayer={true}
            hand={myHand}
            handRef={handRef}
            onHandPointerDown={
              handleHandPointerDown
            }
          />
        </div>
      )}

      {/* =========================
          DRAGGED CARD
      ========================= */}

      {dragging && (
        <Card
          card={dragging.card}
          dragging={true}
          dragX={
            dragging.x - 32
          }
          dragY={
            dragging.y - 47
          }
        />
      )}
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */

export default function CardTable() {
  const [gameData, setGameData] =
    useState(null);

  const [socket, setSocket] =
    useState(null);

  const connectToGame =
    (data) => {
      const newSocket =
        io(BACKEND_URL);

      newSocket.emit(
        "join-game",
        {
          roomId:
            data.roomId,
          token:
            data.player.token
        }
      );

      setSocket(newSocket);
      setGameData(data);
    };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  if (
    !gameData ||
    !socket
  ) {
    return (
      <RoomScreen
        onConnected={
          connectToGame
        }
      />
    );
  }

  return (
    <GameTable
      gameData={gameData}
      socket={socket}
    />
  );
}