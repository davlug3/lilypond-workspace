\version 2.222.2
\header {
  title = "Hello world"
  composer = "dave"
}
    \relative {
  \time 3/4
  \tempo "Andante"
  a'4 a a
  \time 6/8
  \tempo 4. = 96
  a4. a
  \time 4/4
  \tempo "Presto" 4 = 120
  a4 a a a
}
