% Optional setup override for the "chorus" section.
% Must define globalsChorus: self-contained setup (key/time/tempo) that the
% wrapper emits in place of \global before this section's music in every
% stitched voice. Start from shared/shared.ily's \global and change what
% you need — e.g. lift the chorus with `\tempo 4 = 152`.
% NOTE: a \key change here does not reach the ChordNames context (key
% changes are staff-local), so chord names would keep the old key.
globalsChorus = {
  \key e \minor
  \time 4/4
  \tempo 4 = 132
}
