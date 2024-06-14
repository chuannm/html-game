-- DROP TABLE IF EXISTS "user_data";
CREATE TABLE IF NOT EXISTS "user_data" (id VARCHAR(200) PRIMARY KEY,
name VARCHAR(200) NOT NULL,
json_data JSON,
high_score integer DEFAULT 0,
last_answer_is_correct integer DEFAULT 0,
last_question_index integer DEFAULT -1,
start_time TIMESTAMP DEFAULT NOW(),
update_time TIMESTAMP DEFAULT NOW());

ALTER TABLE "user_data" ADD IF NOT EXISTS last_answer_is_correct integer DEFAULT 0; 
ALTER TABLE "user_data" ADD IF NOT EXISTS last_question_index integer DEFAULT -1; 
ALTER TABLE "user_data" ADD IF NOT EXISTS start_time TIMESTAMP DEFAULT NOW(); 
