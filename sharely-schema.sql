CREATE TABLE users (
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,  
  username VARCHAR(25) NOT NULL
    REFERENCES users ON DELETE CASCADE,
  post_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  city TEXT NOT NULL,
  img_url TEXT,
  description TEXT,
  category TEXT NOT NULL,  
  age_group TEXT NOT NULL 
);


CREATE TABLE likes (
  username VARCHAR(25) 
    REFERENCES users ON DELETE CASCADE,
  post_id INTEGER 
    REFERENCES posts ON DELETE CASCADE,
  PRIMARY KEY (username, post_id)
);


CREATE TABLE invites (  
  username VARCHAR(25) 
    REFERENCES users ON DELETE CASCADE,
  post_id INTEGER 
    REFERENCES posts ON DELETE CASCADE,
  PRIMARY KEY (username, post_id)
);


CREATE TABLE comments (
  id SERIAL PRIMARY KEY, 
  username VARCHAR(25) 
    REFERENCES users ON DELETE CASCADE,
  text TEXT NOT NULL, 
  post_id INT NOT NULL 
    REFERENCES posts ON DELETE CASCADE,
  comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



 

