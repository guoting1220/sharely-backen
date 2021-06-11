-- both test users have the password "password"

INSERT INTO users (username, password, first_name, last_name, email, is_admin)
VALUES ('Lisa',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Test',
        'User',
        'joel@joelburton.com',
        FALSE),
       ('Joe',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Test',
        'Admin!',
        'joel@joelburton.com',
        TRUE);

INSERT INTO posts (item_name, username, city, img_url, description, category, age_group)
VALUES 
       ('baby toy', 'Lisa', 'San Jose',
        'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80', 'safe for your little one', 'toy', 'baby'),

        ('blocks', 'Lisa', 'San Jose',
        'https://images.unsplash.com/photo-1589495374906-b7f5ca5de879?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=967&q=80', 'fun toy to play with your kids', 'toy', 'kid'),

        ('books', 'Joe', 'Los Altos',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80', 'Pick what you would like to read. Let me know what books you have to share:)', 'book', 'adult'),

        ('letter puzzle', 'Lisa', 'San Jose',
        'https://images.unsplash.com/photo-1595707678349-4b3f482bfbd3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80', 'nice toy for learning letters', 'toy', 'kid'),

        ('xbox', 'Joe', 'Los Altos',
        'https://images.unsplash.com/photo-1605901309584-818e25960a8f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1178&q=80', 'Would like to share games with you in this summer!', 'game', 'adult'),

       ('baseballs', 'Lisa', 'San Jose',
        'https://images.unsplash.com/photo-1516731415730-0c607149933a?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80', '4 of them, nearly new', 'sport', 'kid'),

       ('pencils', 'Lisa', 'Los altos',
       'https://images.unsplash.com/photo-1588868478777-1500c984167c?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1069&q=80', '12 colors', 'stationery', 'kid'),   

       ('Connect 4', 'Joe', 'Los Altos', 'https://www.blemishcarecosmetics.com/wp-content/uploads/2021/04/no-image-icon-0.jpg', 'fun board game for your family ', 'game', 'all ages'),

       ('Rubiks cube', 'Joe', 'Los Altos',
       'https://images.unsplash.com/photo-1591991564021-0662a8573199?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1051&q=80', 'works well', 'toy', 'all ages'),
       
       ('scooter', 'Lisa', 'Dublin',
       'https://images.unsplash.com/photo-1607606116242-357a0bd4404f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80', '', 'sport', 'youth');
    


INSERT INTO comments (username, text, post_id) VALUES
    ('Joe', 'lovely colors!', 2),
    ('Lisa', 'like it', 2);



INSERT INTO invites (username, post_id) VALUES
    ('Joe', 1),
    ('Joe', 2);
