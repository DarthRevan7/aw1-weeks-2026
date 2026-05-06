/* Data Access Object (DAO) per accedere alle Q&A */
/* Versione iniziale dall'esercizio di settimana 03 */

import sqlite from "sqlite3";
import { Question, Answer } from "./QAModels.js";
import crypto from "crypto";

const db = new sqlite.Database("questions.sqlite", (err) => {
  if (err) throw err;
});

/** DA IMPLEMENTARE **/

// DOMANDE

//All questions
export const listQuestions = () => {
  return new Promise((resolve, reject) => {
    const sqlQuery = "SELECT question.*, user.email FROM question JOIN user ON question.authorId = user.id"
    db.all(sqlQuery, [], (err, rows) => {
      if(err)
      {
        reject(err);
      }
      else {
        const questions = rows.map((q) => new Question(q.id, q.text, q.authorEmail, q.authorId, q.date));
        resolve(questions);
      }
    });
  });
};

//Question by ID
export const getQuestion = (id) => {
  return new Promise((res, rej) => {
    const sqlQuery = "SELECT question.*, user.email FROM question JOIN user ON question.authorId = user.id WHERE question.id = ?"
    db.get(sqlQuery, [id], (err, row) => {
      if(err)
        rej(err);
      else if(row !== undefined) {
        res(new Question(row.id, row.text, row.email, row.authorId, row.date));
      }
      else {
        res({error: "Question not available, check the id."});
      }
    });
  });
};

//Answers from question by id
export const getAnswersFromQuestion = (id) => {
  return new Promise((reject, resolve) => {
    const sql = "SELECT * FROM answer WHERE answer.questionId = ?";
    db.all(sql, [id], (err, rows) => {
      if(err)
        reject(err)
      else {
        answers = rows.map((a) => new Answer(a.id, a.text, a.authorEmail, a.authorId, a.date, a.score));
        resolve(answers)
      }
    });
  });
}





/** RISPOSTE **/

// Get all answers
export const getAllAnswers = () => {
  return new Promise((resolve, reject) => {
    // 1. Usiamo alias chiari (a.id AS ansId) per evitare che l'ID utente sovrascriva l'ID risposta
    const sql = `
      SELECT a.id AS ansId, a.text, a.authorId, a.date, a.score, u.email
      FROM answer AS a
      JOIN user AS u ON a.authorId = u.id
    `;

    // Verifica se db esiste prima di chiamarlo
    if (typeof db === 'undefined') {
        return reject(new Error("L'oggetto 'db' non è definito in questo file!"));
    }

    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        try {
          const answers = rows.map((a) => {
            // Usiamo ansId che abbiamo definito sopra nella query
            return new Answer(a.ansId, a.text, a.email, a.authorId, a.date, a.score);
          });
          resolve(answers);
        } catch (e) {
          // Questo cattura errori se Answer o dayjs non funzionano
          reject(e);
        }
      }
    });
  });
};

export const getAnswers = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT answer.*, user.email FROM answer JOIN user ON answer.authorId = user.id WHERE answer.questionId=?"
    db.all(sql, [id], (err, rows) => {
      if(err)
        reject(err)
      else {
        const answers = rows.map((a) => { return new Answer(a.id, a.text, a.email, a.authorId, a.date, a.score)})
        resolve(answers)
      }
    })
  })
};

export const addAnswer = (a, questionId) => {
  return new Promise((res, rej) => {
    const sql = "INSERT INTO answer(text, authorId, date, score, questionId) VALUES (?,?,?,?,?)"
    db.run(sql, [a.text, a.author.id, a.date, a.score, questionId], function (err){
      if(err)
        rej(err)
      else
        console.log(this)
        res(this.lastID)
    })
  })
};

export const updateAnswer = (ans) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE answer SET text = ?, authorId = ?, date = ?, score = ? WHERE id = ?"
    db.run(sql, [ans.text, ans.author.id, ans.date, ans.score, ans.id], function (err){
      if(err)
        reject(err)
      else
      {
        console.log(this)
        resolve(this.lastID)
      }
    })

  });
};

export const voteAnswer = (id, vote) => {
  return new Promise((resolve, reject) => {
    const sqlPositive = "UPDATE answer SET score = score + 1 WHERE id = ?"
    const sqlNegative = "UPDATE answer SET score = score - 1 where id=?"

    if(vote === "up"){
      db.run(sqlPositive, [id], function(err) {
        if(err) {
          reject(err)
        }
        else {
          console.log(this)
          resolve(1)
        }
      })
    }
    else {
      db.run(sqlNegative, [id], function(err) {
        if(err)
        {
          reject(err)
        }
        else {
          console.log(this)
          resolve(1)
        }
      })
    }
  })
};

/* USERS */
export const getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const user = {id: row.id, username: row.email, name: row.name};
        
        crypto.scrypt(password, row.salt, 16, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.password, "hex"), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};