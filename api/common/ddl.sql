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
ALTER TABLE "user_data" ADD IF NOT EXISTS random_seed integer DEFAULT -1; 

-- SELECT id, name, (start_time - update_time) * 1000 as play_time, high_score FROM user_data ORDER BY high_score DESC, play_time DESC LIMIT 100;