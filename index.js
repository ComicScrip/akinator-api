const PORT = process.env.PORT || 5000;
const express = require('express');
const { Aki } = require('aki-api');
const uniqId = require('uniqid');
const cors = require('cors');

const app = express();
const region = 'en';
const akiInstances = {};

app.use(cors());

app.get('/newsession', async (req, res) => {
  const sessionId = uniqId();
  const aki = new Aki(region);
  akiInstances[sessionId] = aki;
  try {
    await aki.start();
    res.json({ sessionId });
  } catch (e) {
    console.error('err', e);
    res.sendStatus(500);
  }
});

app.get('/nextquestion', async (req, res) => {
  const { sessionId, progressToWin = 95, maxNumberOfSteps = 30 } = req.query;
  const minProgress = parseInt(progressToWin, 10);
  const maxSteps = parseInt(maxNumberOfSteps, 10);
  const aki = akiInstances[sessionId];
  let gameOver = false;

  if (!aki) {
    res.json({ error: 'you must provide a valid session id' });
  } else {
    if (
      req.query.answer &&
      aki.answers.map((_, i) => i).includes(parseInt(req.query.answer, 10))
    ) {
      await aki.step(parseInt(req.query.answer, 10));
    }
    if (aki.progress >= minProgress || aki.currentStep >= maxSteps) {
      await aki.win();
      gameOver = true;
    }
    const { guessCount, answers, question, progress, currentStep } = aki;
    res.json({
      question,
      answers,
      guessCount,
      progress,
      gameOver,
      currentStep,
    });
  }
});

app.get('/back', async (req, res) => {
  const { sessionId } = req.query;
  const aki = akiInstances[sessionId];

  if (!aki) {
    res.json({ error: 'you must provide a valid session id' });
  } else {
    await aki.back();
    const { guessCount, answers, question, progress, currentStep } = aki;
    res.json({
      question,
      answers,
      guessCount,
      progress,
      currentStep,
    });
  }
});

app.listen(PORT, () => {});
