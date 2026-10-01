\version "2.26.0"
%% 04 — Durations, rests, tuplets, ties.
%% Duration table: 1 whole, 2 half, 4 quarter, 8 eighth, 16 32 64.
%% Durations carry over until changed, but RESTATE the duration after
%% any rest, and always end each bar with a | bar check.
%% \tuplet 3/2 { } = triplet; \tuplet 3/2 4 { } = quarter-note triplet.

\score {
  \new Staff {
    \time 4/4
    c1 |
    c2 c2 |
    c4 c4 c4 c4 |
    c8 c8 c8 c8 c4 c4 |
    r1 |
    r2 r4 r8 r16 r32 r64 r64 |
    \tuplet 3/2 { c8 d e } r4 r2 |
    \tuplet 3/2 4 { c4 d e } g2 |
    g2~ g2 |
    r2 r2 |
  }
  \layout { }
}