INSERT INTO `echo`.`questions`
(`questionId`,`category`,`type`,`text`,`active`,`label`)
VALUES
(1, 'cat', 'radio', '', 1, 'q1'),
(2, 'cat', 'radio', '', 1, 'q2'),
(3, 'cat', 'radio', '', 1, 'q3'),
(4, 'cat', 'radio', '', 1, 'q4'),
(5, 'cat', 'radio', '', 1, 'q5'),
(6, 'cat', 'radio', '', 1, 'q6'),
(7, 'cat', 'radio', '', 1, 'q7'),
(8, 'cat', 'radio', '', 1, 'q8');

INSERT INTO `echo`.`answers`
(`answerId`,`questionId`,`text`,`value`)
VALUES
(1, 1, 'I never cough.', 0),
(2, 1, '', 1),
(3, 1, '', 2),
(4, 1, '', 3),
(5, 1, '', 4),
(6, 1, 'I cough all the time.', 5),

(7, 2, 'I have no phlegm in my chest at all.', 0),
(8, 2, '', 1),
(9, 2, '', 2),
(10, 2, '', 3),
(11, 2, '', 4),
(12, 2, 'My chest is completely full of phlegm.', 5),

(13, 3, 'My chest does not feel tight at all.', 0),
(14, 3, '', 1),
(15, 3, '', 2),
(16, 3, '', 3),
(17, 3, '', 4),
(18, 3, 'My chest feels very tight.', 5),

(19, 4, 'When I walk up a hill or one flight of stairs I am not breathless.', 0),
(20, 4, '', 1),
(21, 4, '', 2),
(22, 4, '', 3),
(23, 4, '', 4),
(24, 4, 'When I walk up a hill or one flight of stairs I am very breathless.', 5),

(25, 5, 'I am not limited doing any activities at home.', 0),
(26, 5, '', 1),
(27, 5, '', 2),
(28, 5, '', 3),
(29, 5, '', 4),
(30, 5, 'I am very limited doing activities at home.', 5),

(31, 6, 'I am confident leaving my home despite lung condition.', 0),
(32, 6, '', 1),
(33, 6, '', 2),
(34, 6, '', 3),
(35, 6, '', 4),
(36, 6, 'I am not at all confident leaving my home because od my lung condition.', 5),

(37, 7, 'I sleep soundly.', 0),
(38, 7, '', 1),
(39, 7, '', 2),
(40, 7, '', 3),
(41, 7, '', 4),
(42, 7, 'I dont sleep soundly because of my lung condition.', 5),

(43, 8, 'I have lots of energy.', 0),
(44, 8, '', 1),
(45, 8, '', 2),
(46, 8, '', 3),
(47, 8, '', 4),
(48, 8, 'I have no energy at all.', 5);

