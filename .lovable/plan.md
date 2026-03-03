

## Investigation Results

Queried the database for all distinct `unit` values in `key_results`:

| Unit in DB | Count | Exists in Forms? |
|---|---|---|
| `%` | 97 | Yes |
| `un` | 63 | **NO** |
| `R$` | 42 | Yes |
| `number` | 9 | Yes |
| `pontos` | 6 | Only in KREditModal |
| `dias` | 5 | Yes |
| `score` | 5 | Yes |
| `horas` | 2 | **NO** (we have `h`, not `horas`) |
| `h` | 0 | Yes (just added) |

### Two broken units found:

1. **`un` (Unidades)** — 63 KRs use this unit but it's not in ANY form dropdown. These KRs will show empty unit fields when editing.

2. **`horas`** — 2 KRs use `horas` (full word) but the dropdown only has `h`. These will also show empty.

3. **`pontos`** — exists only in `KREditModal`, missing from the 3 creation forms (`InlineKeyResultForm`, `AddResultadoChaveModal`, `StandaloneKeyResultForm`).

### Solution

**Add missing units to ALL 4 form files:**
- Add `<SelectItem value="un">Unidades (un)</SelectItem>` to all 4 forms
- Add `<SelectItem value="horas">Horas (horas)</SelectItem>` to all 4 forms (keeping `h` as well for backward compat)
- Add `<SelectItem value="pontos">Pontos</SelectItem>` to the 3 creation forms that are missing it

**Files to modify:**
- `src/components/strategic-map/KREditModal.tsx` — add `un`, `horas`
- `src/components/objectives/InlineKeyResultForm.tsx` — add `un`, `horas`, `pontos`
- `src/components/strategic-map/AddResultadoChaveModal.tsx` — add `un`, `horas`, `pontos`
- `src/components/indicators/StandaloneKeyResultForm.tsx` — add `un`, `horas`, `pontos`

