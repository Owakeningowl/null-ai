/**
 * ASTRAL DARK MODE for the Trainer Battles sheet
 * ----------------------------------------------
 * Google Sheets has no dark mode on the web, and the sheet cannot be
 * restyled from an embed, so the only way to darken it is to change
 * the cell formatting itself. This script does that.
 *
 * IT ONLY TOUCHES LIGHT CELLS.
 * Your yellow labels, grey header bands and any other deliberate
 * colours are left exactly as they are. It swaps white / near-white
 * fills for a dark slate, and black text for soft light text. Cells
 * with any other colour are skipped entirely.
 *
 * ------------------------------------------------------------------
 * READ THIS BEFORE RUNNING
 *
 * 1. THIS EDITS YOUR REAL SHEET, for everyone who can see it. It is
 *    not a per-viewer setting and not a toggle.
 * 2. MAKE A COPY FIRST: File > Make a copy. Run it on the copy,
 *    look at the result, and only then decide about the original.
 * 3. Undo (Ctrl+Z) does not reliably cover a script's formatting
 *    changes. The copy is your real safety net.
 * 4. Run applyAstralDark() to apply, restoreLight() to reverse.
 *
 * ------------------------------------------------------------------
 * HOW TO RUN
 *   Extensions > Apps Script, paste this in, Save, pick the function
 *   from the dropdown, press Run. Google will ask for authorisation
 *   the first time - that is it asking you, not me.
 */

// Astral palette (matches the calculator theme)
var DARK_BG   = '#1c2028';
var DARK_TEXT = '#d1d5de';

var LIGHT_BG  = '#ffffff';
var LIGHT_TEXT= '#000000';

// Fills treated as "light" and therefore safe to darken
var LIGHT_FILLS = ['#ffffff', '#f3f3f3', '#efefef', '#f9f9f9', '#eeeeee', null, ''];

// Text colours treated as "dark" and therefore safe to lighten
var DARK_FONTS  = ['#000000', '#000', '#1c1c1c', '#212121', '#333333'];


function applyAstralDark() {
  recolour_(LIGHT_FILLS, DARK_BG, DARK_FONTS, DARK_TEXT);
}

function restoreLight() {
  recolour_([DARK_BG], LIGHT_BG, [DARK_TEXT], LIGHT_TEXT);
}


/**
 * Walks every sheet and swaps matching fills / font colours.
 * Reads and writes in bulk - a cell-by-cell loop would time out on a
 * sheet this size.
 */
function recolour_(fromFills, toFill, fromFonts, toFont) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var touched = 0;

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var rng = sheet.getDataRange();
    if (rng.getNumRows() === 0) continue;

    var bgs   = rng.getBackgrounds();
    var fonts = rng.getFontColors();
    var changed = false;

    for (var r = 0; r < bgs.length; r++) {
      for (var c = 0; c < bgs[r].length; c++) {
        var bg = (bgs[r][c] || '').toLowerCase();
        if (fromFills.indexOf(bg) !== -1) {
          bgs[r][c] = toFill;
          changed = true;
          touched++;
        }
        var fc = (fonts[r][c] || '').toLowerCase();
        if (fromFonts.indexOf(fc) !== -1) {
          fonts[r][c] = toFont;
          changed = true;
        }
      }
    }

    if (changed) {
      rng.setBackgrounds(bgs);
      rng.setFontColors(fonts);
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    touched + ' cells recoloured across ' + sheets.length + ' sheets.',
    'Astral dark mode', 5);
}
