#!/usr/bin/env bash
# Regenerate the instruction tables from the opcode tables in tools/sharc_isa.py:
# data/languages/sharc214xx.sinc (ADSP-214xx) and data/languages/sharcplus.sinc (SHARC+,
# SHARC_VARIANT=plus).  CI runs this and fails if the committed files differ.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
python3 tools/gen_sinc.py data/languages/sharc214xx.sinc
SHARC_VARIANT=plus python3 tools/gen_sinc.py data/languages/sharcplus.sinc
