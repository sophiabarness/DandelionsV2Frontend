# Dandelions V2 Frontend

This repository contains the code for the Dandelions multiplayer game. The game uses HTML/CSS/Javascript, two.js, and vite for the frontend. Make sure to set your Websocket/API URLs in an .env file. Link to play the game: [https://main.d389393yut7p4z.amplifyapp.com/](https://main.d389393yut7p4z.amplifyapp.com/).

## Overview

The game allows players to:
- Enter a game room with another player.
- Play the dandelions game in real-time.

The dandelions game is a more complicated version of tic-tac-toe. The websocket connection allows players to join a room and play a game. Communication within the game is done by sending properly formatted messages to each other containing the turns taken. The REST API is used for checking if a roomId already exists in the database before a new player joins. 

## Backend

The backend lambda functions for integrating with the websocket/REST API for the Dandelions V2 game is available [here](https://github.com/sophiabarness/DandelionsV2Backend). 