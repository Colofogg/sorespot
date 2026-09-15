import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Gender, ViewAngle } from '../types'

interface Props {
  gender: Gender
  view: ViewAngle
  selected: Set<string>
  onToggle: (regionId: string) => void
  /** When true, suppress hotspot toggle (parent is treating gesture as rotate). */
  suppressTap?: boolean
  pressedId?: string | null
  onHotspotPointerDown?: (regionId: string, e: ReactPointerEvent) => void
}

type Hotspot = { id: string; d: string; label: string }

const HINT_KEY = 'sorespot-hotspot-hint-v13'

function hotspotsFor(view: ViewAngle, gender: Gender): Hotspot[] {
  const male = gender === 'male'
  // Athletic female: slightly narrower shoulders / softer hip flare
  const sx = male ? 0 : 2
  const hx = male ? 0 : -2

  if (view === 'front') {
    return [
      {
        id: 'neck',
        label: 'Neck',
        d: `M${88 + sx} 58 C${94 + sx} 54 ${106 - sx} 54 ${112 - sx} 58 C${114 - sx} 72 ${114 - sx} 86 ${110 - sx} 96 C${104 - sx} 100 ${96 + sx} 100 ${90 + sx} 96 C${86 + sx} 86 ${86 + sx} 72 ${88 + sx} 58 Z`,
      },
      {
        id: 'traps',
        label: 'Traps',
        d: `M${70 + sx} 78 C${82 + sx} 70 ${118 - sx} 70 ${130 - sx} 78 C${142 - sx} 92 ${148 - sx} 108 ${140 - sx} 118 C${128 - sx} 114 ${112 - sx} 104 ${100} 100 C${88 + sx} 104 ${72 + sx} 114 ${60 + sx} 118 C${52 + sx} 108 ${58 + sx} 92 ${70 + sx} 78 Z`,
      },
      {
        id: 'shoulders',
        label: 'Shoulders',
        d: `M${42 + sx} 96 C${56 + sx} 86 ${70 + sx} 90 ${84 + sx} 102 C${92 + sx} 110 ${108 - sx} 110 ${116 - sx} 102 C${130 - sx} 90 ${144 - sx} 86 ${158 - sx} 96 C${166 - sx} 112 ${164 - sx} 132 ${154 - sx} 142 C${140 - sx} 136 ${124 - sx} 128 ${100} 124 C${76 + sx} 128 ${60 + sx} 136 ${46 + sx} 142 C${36 + sx} 132 ${34 + sx} 112 ${42 + sx} 96 Z`,
      },
      {
        id: 'chest',
        label: 'Chest',
        d: `M${68 + sx} 122 C${80 + sx} 116 ${120 - sx} 116 ${132 - sx} 122 C${136 - sx} 140 ${134 - sx} 164 ${128 - sx} 182 C${116 - sx} 188 ${84 + sx} 188 ${72 + sx} 182 C${66 + sx} 164 ${64 + sx} 140 ${68 + sx} 122 Z`,
      },
      {
        id: 'abs',
        label: 'Abs',
        d: `M${74 + sx} 178 C${86 + sx} 174 ${114 - sx} 174 ${126 - sx} 178 C${128 - sx} 198 ${126 - sx} 220 ${122 - sx} 238 C${112 - sx} 244 ${88 + sx} 244 ${78 + sx} 238 C${74 + sx} 220 ${72 + sx} 198 ${74 + sx} 178 Z`,
      },
      {
        id: 'hips-glutes-l',
        label: 'Left hip / glute',
        d: `M${58 + hx} 230 C${72 + hx} 224 ${96} 226 ${100} 236 C${100} 258 ${98} 278 ${92} 292 C${78 + hx} 296 ${62 + hx} 288 ${56 + hx} 272 C${52 + hx} 256 ${54 + hx} 240 ${58 + hx} 230 Z`,
      },
      {
        id: 'hips-glutes-r',
        label: 'Right hip / glute',
        d: `M${100} 236 C${104} 226 ${128 - hx} 224 ${142 - hx} 230 C${146 - hx} 240 ${148 - hx} 256 ${144 - hx} 272 C${138 - hx} 288 ${122 - hx} 296 ${108} 292 C${102} 278 ${100} 258 ${100} 236 Z`,
      },
      {
        id: 'quads-l',
        label: 'Left quads',
        d: 'M64 286 C76 280 94 282 98 294 C96 318 94 340 90 358 C80 364 68 360 64 346 C60 324 60 304 64 286 Z',
      },
      {
        id: 'quads-r',
        label: 'Right quads',
        d: 'M102 294 C106 282 124 280 136 286 C140 304 140 324 136 346 C132 360 120 364 110 358 C106 340 104 318 102 294 Z',
      },
      // Tall organic outer-thigh capsules (IT band) — hit area ≥ ~44dp
      {
        id: 'it-band-l',
        label: 'Outer thigh (IT band)',
        d: 'M46 278 C56 272 68 274 72 286 C70 310 68 334 66 358 C62 368 52 370 46 360 C42 336 40 310 42 290 C42 284 44 280 46 278 Z',
      },
      {
        id: 'it-band-r',
        label: 'Outer thigh (IT band)',
        d: 'M128 286 C132 274 144 272 154 278 C156 280 158 284 158 290 C160 310 158 336 154 360 C148 370 138 368 134 358 C132 334 130 310 128 286 Z',
      },
      {
        id: 'knees-l',
        label: 'Left knee',
        d: 'M66 352 C78 348 94 350 96 362 C94 376 90 386 80 388 C70 386 66 376 64 362 C64 356 64 354 66 352 Z',
      },
      {
        id: 'knees-r',
        label: 'Right knee',
        d: 'M104 362 C106 350 122 348 134 352 C136 354 136 356 136 362 C134 376 130 386 120 388 C110 386 106 376 104 362 Z',
      },
      {
        id: 'calves-l',
        label: 'Left calf',
        d: 'M68 386 C78 382 94 384 96 396 C94 416 90 434 86 446 C78 452 70 448 68 436 C64 418 64 400 68 386 Z',
      },
      {
        id: 'calves-r',
        label: 'Right calf',
        d: 'M104 396 C106 384 122 382 132 386 C136 400 136 418 132 436 C130 448 122 452 114 446 C110 434 106 416 104 396 Z',
      },
      {
        id: 'ankles-l',
        label: 'Left ankle',
        d: 'M70 442 C80 438 92 440 94 450 C92 458 88 464 80 466 C72 464 68 458 68 450 C68 446 68 444 70 442 Z',
      },
      {
        id: 'ankles-r',
        label: 'Right ankle',
        d: 'M106 450 C108 440 120 438 130 442 C132 444 132 446 132 450 C132 458 128 464 120 466 C112 464 108 458 106 450 Z',
      },
      {
        id: 'soles-feet',
        label: 'Soles / feet',
        d: 'M58 460 C72 456 92 458 98 466 C96 474 88 480 74 480 C62 478 56 470 58 460 Z M102 466 C108 458 128 456 142 460 C144 470 138 478 126 480 C112 480 104 474 102 466 Z',
      },
      {
        id: 'elbows-forearms',
        label: 'Elbows / forearms',
        d: `M${22 + sx} 148 C${34 + sx} 138 ${48 + sx} 140 ${52 + sx} 152 C${48 + sx} 176 ${42 + sx} 200 ${36 + sx} 224 C${28 + sx} 232 ${18 + sx} 228 ${16 + sx} 214 C${16 + sx} 190 ${18 + sx} 166 ${22 + sx} 148 Z M${148 - sx} 152 C${152 - sx} 140 ${166 - sx} 138 ${178 - sx} 148 C${182 - sx} 166 ${184 - sx} 190 ${184 - sx} 214 C${182 - sx} 228 ${172 - sx} 232 ${164 - sx} 224 C${158 - sx} 200 ${152 - sx} 176 ${148 - sx} 152 Z`,
      },
      {
        id: 'wrists-hands',
        label: 'Wrists / hands',
        d: `M${12 + sx} 220 C${24 + sx} 214 ${40 + sx} 216 ${44 + sx} 228 C${42 + sx} 244 ${36 + sx} 256 ${28 + sx} 262 C${18 + sx} 262 ${10 + sx} 252 ${10 + sx} 238 C${10 + sx} 228 ${10 + sx} 224 ${12 + sx} 220 Z M${156 - sx} 228 C${160 - sx} 216 ${176 - sx} 214 ${188 - sx} 220 C${190 - sx} 224 ${190 - sx} 228 ${190 - sx} 238 C${190 - sx} 252 ${182 - sx} 262 ${172 - sx} 262 C${164 - sx} 256 ${158 - sx} 244 ${156 - sx} 228 Z`,
      },
    ]
  }

  if (view === 'three-quarter') {
    return [
      {
        id: 'neck',
        label: 'Neck',
        d: 'M92 58 C98 54 114 56 118 62 C120 74 118 88 114 98 C108 102 98 100 94 94 C90 82 90 68 92 58 Z',
      },
      {
        id: 'traps',
        label: 'Traps',
        d: 'M74 80 C86 72 124 78 136 90 C146 102 150 116 142 124 C130 120 114 110 102 106 C90 110 76 118 66 122 C58 112 62 92 74 80 Z',
      },
      {
        id: 'shoulders',
        label: 'Shoulders',
        d: 'M48 100 C62 90 78 94 90 106 C100 114 118 118 130 112 C142 104 154 100 160 112 C166 128 162 144 152 152 C140 146 124 138 104 132 C84 136 66 144 52 150 C40 138 38 114 48 100 Z',
      },
      {
        id: 'chest',
        label: 'Chest',
        d: 'M66 128 C78 122 116 128 124 136 C128 152 126 174 120 188 C108 194 78 190 70 182 C64 164 62 144 66 128 Z',
      },
      {
        id: 'upper-back',
        label: 'Upper back',
        d: 'M118 126 C128 122 148 130 152 142 C150 160 146 178 140 188 C130 186 120 178 116 166 C114 152 114 138 118 126 Z',
      },
      {
        id: 'abs',
        label: 'Abs',
        d: 'M72 182 C84 178 112 184 118 192 C120 210 118 230 114 244 C104 250 82 246 74 238 C70 220 68 198 72 182 Z',
      },
      {
        id: 'lower-back',
        label: 'Lower back',
        d: 'M112 210 C122 206 142 214 146 226 C144 242 140 256 134 264 C124 262 114 254 110 242 C108 230 108 218 112 210 Z',
      },
      {
        id: 'hips-glutes-l',
        label: 'Left hip / glute',
        d: 'M60 228 C74 222 96 228 100 238 C98 258 96 278 90 292 C76 296 60 288 56 272 C52 256 54 238 60 228 Z',
      },
      {
        id: 'hips-glutes-r',
        label: 'Right hip / glute',
        d: 'M100 238 C106 228 134 232 148 242 C152 256 154 276 148 294 C138 302 118 298 108 290 C102 274 100 256 100 238 Z',
      },
      {
        id: 'quads-l',
        label: 'Left quads',
        d: 'M62 286 C74 280 92 286 96 298 C94 320 90 342 86 360 C76 366 66 360 62 346 C58 324 58 304 62 286 Z',
      },
      {
        id: 'quads-r',
        label: 'Right quads',
        d: 'M98 296 C104 286 128 288 140 298 C144 318 142 340 138 360 C130 368 116 364 108 354 C102 336 98 316 98 296 Z',
      },
      {
        id: 'it-band-r',
        label: 'Outer thigh (IT band)',
        d: 'M130 288 C138 280 152 284 158 296 C160 320 158 344 156 368 C150 378 140 376 134 366 C132 342 130 316 130 288 Z',
      },
      {
        id: 'it-band-l',
        label: 'Outer thigh (IT band)',
        d: 'M48 280 C56 274 66 276 70 288 C68 310 66 332 64 352 C60 360 50 360 46 350 C42 328 42 304 44 288 C44 284 46 282 48 280 Z',
      },
      {
        id: 'hamstrings-r',
        label: 'Right hamstring',
        d: 'M118 306 C128 300 142 304 146 316 C144 336 140 352 134 362 C126 366 116 360 114 348 C114 332 114 316 118 306 Z',
      },
      {
        id: 'knees-l',
        label: 'Left knee',
        d: 'M66 354 C76 350 92 354 94 366 C92 380 88 388 78 390 C68 388 64 378 64 366 C64 360 64 356 66 354 Z',
      },
      {
        id: 'knees-r',
        label: 'Right knee',
        d: 'M104 364 C108 352 128 354 136 364 C138 378 134 390 122 392 C112 390 104 380 104 364 Z',
      },
      {
        id: 'calves-l',
        label: 'Left calf',
        d: 'M68 388 C78 384 92 388 94 400 C92 420 88 438 84 448 C76 454 68 450 66 438 C64 420 64 402 68 388 Z',
      },
      {
        id: 'calves-r',
        label: 'Right calf',
        d: 'M106 396 C110 386 128 388 136 400 C138 418 136 438 132 450 C124 456 114 452 108 440 C104 422 104 406 106 396 Z',
      },
      {
        id: 'ankles-l',
        label: 'Left ankle',
        d: 'M70 444 C80 440 90 444 92 452 C90 460 86 466 78 468 C70 466 68 460 68 452 C68 448 68 446 70 444 Z',
      },
      {
        id: 'ankles-r',
        label: 'Right ankle',
        d: 'M108 450 C112 442 126 444 132 452 C132 460 128 466 120 468 C112 466 108 460 108 450 Z',
      },
      {
        id: 'soles-feet',
        label: 'Soles / feet',
        d: 'M58 458 C72 454 90 458 96 466 C94 474 86 480 72 480 C60 476 56 468 58 458 Z M104 466 C110 458 130 460 140 468 C140 476 132 480 120 480 C108 476 102 472 104 466 Z',
      },
      {
        id: 'elbows-forearms',
        label: 'Elbows / forearms',
        d: 'M30 150 C42 140 56 144 58 156 C54 178 48 202 42 224 C34 232 24 228 24 214 C24 190 26 168 30 150 Z M140 154 C148 144 164 150 170 162 C174 182 176 204 174 226 C168 234 158 230 152 220 C146 198 142 174 140 154 Z',
      },
      {
        id: 'wrists-hands',
        label: 'Wrists / hands',
        d: 'M20 220 C32 214 48 218 50 230 C48 246 42 258 34 262 C22 262 16 252 16 238 C16 228 16 224 20 220 Z M150 226 C156 216 172 220 178 230 C180 244 176 258 166 262 C156 258 150 246 150 226 Z',
      },
    ]
  }

  if (view === 'back') {
    return [
      {
        id: 'neck',
        label: 'Neck',
        d: `M${88 + sx} 58 C${94 + sx} 54 ${106 - sx} 54 ${112 - sx} 58 C${114 - sx} 72 ${114 - sx} 86 ${110 - sx} 96 C${104 - sx} 100 ${96 + sx} 100 ${90 + sx} 96 C${86 + sx} 86 ${86 + sx} 72 ${88 + sx} 58 Z`,
      },
      {
        id: 'traps',
        label: 'Traps',
        d: `M${68 + sx} 80 C${82 + sx} 70 ${118 - sx} 70 ${132 - sx} 80 C${144 - sx} 94 ${150 - sx} 110 ${142 - sx} 120 C${128 - sx} 114 ${112 - sx} 104 ${100} 100 C${88 + sx} 104 ${72 + sx} 114 ${58 + sx} 120 C${50 + sx} 110 ${56 + sx} 94 ${68 + sx} 80 Z`,
      },
      {
        id: 'shoulders',
        label: 'Shoulders',
        d: `M${42 + sx} 96 C${56 + sx} 86 ${70 + sx} 90 ${84 + sx} 102 C${92 + sx} 110 ${108 - sx} 110 ${116 - sx} 102 C${130 - sx} 90 ${144 - sx} 86 ${158 - sx} 96 C${166 - sx} 112 ${164 - sx} 132 ${154 - sx} 142 C${140 - sx} 136 ${124 - sx} 128 ${100} 124 C${76 + sx} 128 ${60 + sx} 136 ${46 + sx} 142 C${36 + sx} 132 ${34 + sx} 112 ${42 + sx} 96 Z`,
      },
      {
        id: 'upper-back',
        label: 'Upper back',
        d: `M${68 + sx} 120 C${80 + sx} 114 ${120 - sx} 114 ${132 - sx} 120 C${136 - sx} 140 ${134 - sx} 160 ${128 - sx} 176 C${116 - sx} 182 ${84 + sx} 182 ${72 + sx} 176 C${66 + sx} 160 ${64 + sx} 140 ${68 + sx} 120 Z`,
      },
      {
        id: 'mid-back',
        label: 'Mid back',
        d: `M${72 + sx} 172 C${84 + sx} 168 ${116 - sx} 168 ${128 - sx} 172 C${130 - sx} 188 ${128 - sx} 204 ${124 - sx} 218 C${114 - sx} 224 ${86 + sx} 224 ${76 + sx} 218 C${72 + sx} 204 ${70 + sx} 188 ${72 + sx} 172 Z`,
      },
      {
        id: 'lower-back',
        label: 'Lower back',
        d: `M${74 + sx} 214 C${86 + sx} 210 ${114 - sx} 210 ${126 - sx} 214 C${132 - hx} 230 ${134 - hx} 248 ${130 - hx} 260 C${116 - hx} 266 ${84 + hx} 266 ${70 + hx} 260 C${66 + hx} 248 ${68 + sx} 230 ${74 + sx} 214 Z`,
      },
      {
        id: 'hips-glutes-l',
        label: 'Left hip / glute',
        d: `M${54 + hx} 254 C${70 + hx} 248 ${96} 252 ${100} 264 C${100} 284 ${98} 302 ${90} 314 C${74 + hx} 318 ${56 + hx} 308 ${50 + hx} 290 C${48 + hx} 274 ${50 + hx} 260 ${54 + hx} 254 Z`,
      },
      {
        id: 'hips-glutes-r',
        label: 'Right hip / glute',
        d: `M${100} 264 C${104} 252 ${130 - hx} 248 ${146 - hx} 254 C${150 - hx} 260 ${152 - hx} 274 ${150 - hx} 290 C${144 - hx} 308 ${126 - hx} 318 ${110} 314 C${102} 302 ${100} 284 ${100} 264 Z`,
      },
      {
        id: 'hamstrings-l',
        label: 'Left hamstring',
        d: 'M60 308 C74 302 94 306 98 318 C96 338 92 356 86 368 C76 372 64 366 60 352 C56 336 56 320 60 308 Z',
      },
      {
        id: 'hamstrings-r',
        label: 'Right hamstring',
        d: 'M102 318 C106 306 126 302 140 308 C144 320 144 336 140 352 C136 366 124 372 114 368 C108 356 104 338 102 318 Z',
      },
      {
        id: 'it-band-l',
        label: 'Outer thigh (IT band)',
        d: 'M42 300 C52 294 66 296 70 308 C68 330 66 350 64 370 C60 378 50 378 44 368 C40 346 38 322 40 308 C40 304 40 302 42 300 Z',
      },
      {
        id: 'it-band-r',
        label: 'Outer thigh (IT band)',
        d: 'M130 308 C134 296 148 294 158 300 C160 302 160 304 160 308 C162 322 160 346 156 368 C150 378 140 378 136 370 C134 350 132 330 130 308 Z',
      },
      {
        id: 'knees-l',
        label: 'Left knee',
        d: 'M66 364 C78 360 94 362 96 374 C94 386 90 396 80 398 C70 396 66 386 64 374 C64 368 64 366 66 364 Z',
      },
      {
        id: 'knees-r',
        label: 'Right knee',
        d: 'M104 374 C106 362 122 360 134 364 C136 366 136 368 136 374 C134 386 130 396 120 398 C110 396 106 386 104 374 Z',
      },
      {
        id: 'calves-l',
        label: 'Left calf',
        d: 'M68 394 C78 390 94 392 96 404 C94 422 90 438 86 448 C78 454 70 450 68 438 C64 422 64 406 68 394 Z',
      },
      {
        id: 'calves-r',
        label: 'Right calf',
        d: 'M104 404 C106 392 122 390 132 394 C136 406 136 422 132 438 C130 450 122 454 114 448 C110 438 106 422 104 404 Z',
      },
      {
        id: 'ankles-l',
        label: 'Left ankle',
        d: 'M70 444 C80 440 92 442 94 452 C92 460 88 466 80 468 C72 466 68 460 68 452 C68 448 68 446 70 444 Z',
      },
      {
        id: 'ankles-r',
        label: 'Right ankle',
        d: 'M106 452 C108 442 120 440 130 444 C132 446 132 448 132 452 C132 460 128 466 120 468 C112 466 108 460 106 452 Z',
      },
      {
        id: 'soles-feet',
        label: 'Soles / feet',
        d: 'M58 460 C72 456 92 458 98 466 C96 474 88 480 74 480 C62 478 56 470 58 460 Z M102 466 C108 458 128 456 142 460 C144 470 138 478 126 480 C112 480 104 474 102 466 Z',
      },
      {
        id: 'elbows-forearms',
        label: 'Elbows / forearms',
        d: `M${22 + sx} 148 C${34 + sx} 138 ${48 + sx} 140 ${52 + sx} 152 C${48 + sx} 176 ${42 + sx} 200 ${36 + sx} 224 C${28 + sx} 232 ${18 + sx} 228 ${16 + sx} 214 C${16 + sx} 190 ${18 + sx} 166 ${22 + sx} 148 Z M${148 - sx} 152 C${152 - sx} 140 ${166 - sx} 138 ${178 - sx} 148 C${182 - sx} 166 ${184 - sx} 190 ${184 - sx} 214 C${182 - sx} 228 ${172 - sx} 232 ${164 - sx} 224 C${158 - sx} 200 ${152 - sx} 176 ${148 - sx} 152 Z`,
      },
    ]
  }

  // Side: left-facing profile — right side near
  return [
    {
      id: 'neck',
      label: 'Neck',
      d: 'M86 58 C96 52 114 54 120 64 C122 76 118 90 112 98 C104 100 92 96 88 88 C84 78 82 66 86 58 Z',
    },
    {
      id: 'traps',
      label: 'Traps',
      d: 'M94 82 C108 74 132 80 140 94 C144 106 142 118 134 124 C122 120 108 112 98 110 C92 104 90 92 94 82 Z',
    },
    {
      id: 'shoulders',
      label: 'Shoulders',
      d: 'M78 92 C96 84 130 88 146 102 C152 116 150 136 140 146 C126 140 108 132 92 130 C80 124 72 110 78 92 Z',
    },
    {
      id: 'chest',
      label: 'Chest',
      d: 'M52 116 C68 108 96 112 106 124 C110 144 108 164 102 182 C88 188 62 186 54 174 C48 156 48 134 52 116 Z',
    },
    {
      id: 'upper-back',
      label: 'Upper back',
      d: 'M112 112 C128 106 154 118 160 134 C158 154 154 172 148 184 C136 180 120 170 114 158 C110 142 110 126 112 112 Z',
    },
    {
      id: 'abs',
      label: 'Abs',
      d: 'M56 178 C72 170 100 174 112 186 C116 206 114 228 108 246 C94 252 68 250 60 238 C54 218 52 196 56 178 Z',
    },
    {
      id: 'mid-back',
      label: 'Mid back',
      d: 'M114 168 C130 162 154 172 158 186 C156 206 152 224 146 236 C134 232 120 222 114 210 C110 196 110 180 114 168 Z',
    },
    {
      id: 'lower-back',
      label: 'Lower back',
      d: 'M110 220 C128 214 154 226 162 242 C164 256 160 270 152 278 C136 274 118 266 110 256 C106 244 106 230 110 220 Z',
    },
    {
      id: 'hips-glutes',
      label: 'Hips / glutes',
      d: 'M60 244 C88 234 140 248 168 266 C174 284 170 306 158 318 C130 322 88 314 64 300 C54 282 54 260 60 244 Z',
    },
    {
      id: 'quads-r',
      label: 'Right quads',
      d: 'M48 298 C68 290 96 298 104 314 C100 336 94 356 88 372 C74 378 54 370 48 354 C44 334 44 314 48 298 Z',
    },
    {
      id: 'hamstrings-r',
      label: 'Right hamstring',
      d: 'M112 306 C130 298 152 308 160 324 C158 344 152 362 144 372 C130 376 116 368 112 354 C110 338 110 320 112 306 Z',
    },
    {
      id: 'it-band-r',
      label: 'Outer thigh (IT band)',
      d: 'M78 286 C96 276 118 286 128 304 C130 328 126 354 120 378 C108 390 90 384 82 368 C76 344 74 312 78 286 Z',
    },
    {
      id: 'knees-r',
      label: 'Right knee',
      d: 'M52 362 C72 356 104 364 116 376 C114 390 106 402 88 404 C68 400 50 388 52 362 Z',
    },
    {
      id: 'calves-r',
      label: 'Right calf',
      d: 'M54 398 C76 390 108 400 120 416 C118 434 112 450 104 460 C86 466 64 456 56 440 C52 424 52 410 54 398 Z',
    },
    {
      id: 'ankles-r',
      label: 'Right ankle',
      d: 'M60 448 C80 442 108 450 118 460 C116 468 108 474 92 474 C72 470 58 462 60 448 Z',
    },
    {
      id: 'soles-feet',
      label: 'Soles / feet',
      d: 'M32 460 C60 454 100 460 122 470 C124 478 110 486 78 486 C48 482 30 474 32 460 Z M128 458 C146 452 168 458 176 470 C174 478 160 484 142 482 C130 476 126 468 128 458 Z',
    },
    {
      id: 'elbows-forearms',
      label: 'Elbows / forearms',
      d: 'M66 142 C80 134 96 142 100 156 C102 178 100 200 96 222 C88 230 74 226 70 214 C66 190 64 164 66 142 Z',
    },
    {
      id: 'wrists-hands',
      label: 'Wrists / hands',
      d: 'M68 220 C82 214 98 222 104 234 C104 248 98 260 88 264 C76 262 66 250 68 220 Z',
    },
  ]
}

/** Continuous organic silhouettes — single shaded mesh, not hotspot bricks. */
function silhouettePath(view: ViewAngle, gender: Gender): string {
  const male = gender === 'male'
  if (view === 'side') {
    // Left-facing profile (face left). Continuous filled silhouette — never blank.
    return male
      ? 'M102 20 C92 18 80 22 74 30 C68 36 64 42 66 48 L70 54 L74 60 L82 66 L88 74 L82 86 L72 104 L64 128 L58 156 L56 186 L58 216 L64 244 L72 268 L66 286 L58 310 L54 340 L52 372 L54 404 L58 432 L52 452 L40 462 L36 472 L48 478 L110 480 L118 468 L116 448 L114 420 L116 388 L122 356 L130 328 L142 308 L156 318 L164 348 L168 384 L166 420 L164 448 L170 464 L178 476 L148 480 L140 466 L138 440 L140 404 L144 368 L150 340 L158 318 L168 300 L174 278 L172 252 L166 224 L160 192 L158 160 L152 130 L140 104 L126 86 L118 74 L122 62 C128 52 130 38 124 28 C118 20 110 18 102 20 Z M78 118 C70 130 66 150 66 172 C66 198 70 224 76 246 L90 248 C94 224 96 198 96 172 C96 148 92 130 88 120 Z'
      : 'M100 18 C90 16 78 20 72 28 C66 34 62 40 64 46 L68 52 L72 58 L80 64 L86 72 L80 84 L70 102 L62 126 L56 154 L54 184 L56 214 L64 242 L74 266 L68 284 L60 308 L56 338 L54 370 L56 402 L60 430 L54 450 L42 460 L38 470 L50 478 L108 480 L116 468 L114 448 L112 420 L114 388 L120 356 L128 328 L140 308 L154 318 L162 348 L166 384 L164 420 L162 448 L168 464 L176 476 L146 480 L138 466 L136 440 L138 404 L142 368 L148 340 L156 318 L166 298 L172 276 L170 250 L164 222 L158 190 L156 158 L150 128 L138 102 L124 84 L116 72 L120 60 C126 50 128 36 122 26 C116 18 108 16 100 18 Z M76 116 C68 128 64 148 64 170 C64 196 68 222 74 244 L88 246 C92 222 94 196 94 170 C94 146 90 128 86 118 Z'
  }

  if (view === 'three-quarter') {
    return male
      ? 'M104 22 C120 20 132 34 130 50 C128 60 120 68 112 72 C126 80 152 100 164 128 C174 154 178 184 172 214 C168 238 162 258 158 276 C168 294 174 320 172 350 C170 382 164 416 160 446 C164 460 172 472 178 480 C182 484 178 488 168 488 L124 486 C118 470 116 446 114 418 C112 388 112 358 114 330 C110 358 106 388 102 418 C100 446 98 470 94 486 L54 484 C48 472 52 458 56 444 C60 414 58 380 56 350 C54 320 58 294 68 276 C64 258 58 238 54 214 C48 184 50 154 60 128 C72 100 92 80 102 72 C94 68 88 60 88 50 C88 34 92 22 104 22 Z'
      : 'M104 20 C118 18 128 32 126 48 C124 58 118 66 110 70 C120 78 144 98 156 124 C164 150 168 178 162 208 C158 232 154 252 152 270 C162 288 168 314 166 344 C164 376 158 410 154 440 C158 454 166 466 172 474 C176 478 172 482 162 482 L126 480 C120 464 118 440 116 412 C114 382 114 352 116 324 C112 352 108 382 104 412 C102 440 100 464 96 480 L60 478 C54 466 58 452 62 438 C66 408 64 374 62 344 C60 314 64 288 74 270 C70 252 66 232 64 208 C60 178 62 150 72 124 C84 98 100 78 108 70 C100 66 94 58 94 48 C94 32 92 20 104 20 Z'
  }

  // Front/back: ONE outer contour (no self-intersecting arm tunnels)
  if (male) {
    return [
      'M100 20',
      'C116 18 128 32 126 48',
      'C124 58 116 66 108 70',
      'C124 78 150 96 164 124',
      'C174 148 178 178 172 208',
      'C168 230 160 248 152 262',
      'C160 278 168 300 170 326',
      'C172 356 168 392 164 428',
      'C162 452 164 470 170 482',
      'C174 488 164 492 148 492',
      'L116 490',
      'C112 468 110 440 108 408',
      'C106 376 106 344 108 316',
      'C104 344 102 376 100 408',
      'C98 440 96 468 92 490',
      'L60 492',
      'C44 492 36 488 40 482',
      'C46 470 48 452 46 428',
      'C42 392 38 356 40 326',
      'C42 300 50 278 58 262',
      'C50 248 42 230 38 208',
      'C32 178 36 148 46 124',
      'C60 96 86 78 102 70',
      'C94 66 86 58 84 48',
      'C82 32 88 18 100 20 Z',
    ].join(' ')
  }
  // Female athletic-neutral: narrower shoulders, natural waist→hip
  return [
    'M100 18',
    'C114 16 124 30 122 46',
    'C120 56 114 64 106 68',
    'C118 76 142 94 154 120',
    'C162 144 164 172 158 200',
    'C154 222 148 240 142 254',
    'C152 270 162 292 164 320',
    'C166 350 162 386 158 422',
    'C156 446 158 464 164 476',
    'C168 482 158 486 144 486',
    'L118 484',
    'C114 462 112 434 110 402',
    'C108 370 108 338 110 310',
    'C106 338 104 370 102 402',
    'C100 434 98 462 94 484',
    'L66 486',
    'C52 486 44 482 48 476',
    'C54 464 56 446 54 422',
    'C50 386 46 350 48 320',
    'C50 292 60 270 70 254',
    'C64 240 58 222 54 200',
    'C48 172 50 144 58 120',
    'C70 94 92 76 104 68',
    'C96 64 90 56 88 46',
    'C86 30 90 16 100 18 Z',
  ].join(' ')
}

function muscleGuides(view: ViewAngle, gender: Gender): string[] {
  const male = gender === 'male'
  if (view === 'front') {
    return male
      ? [
          'M100 124 C100 170 100 210 100 236',
          'M76 146 C90 154 110 154 124 146',
          'M78 186 C90 194 110 194 122 186',
          'M80 300 C86 320 84 342 82 352',
          'M120 300 C114 320 116 342 118 352',
          'M50 168 C44 196 44 220 48 240',
          'M150 168 C156 196 156 220 152 240',
        ]
      : [
          'M100 122 C100 166 100 206 100 232',
          'M78 144 C90 152 110 152 122 144',
          'M80 184 C90 192 110 192 120 184',
          'M82 298 C88 318 86 340 84 350',
          'M118 298 C112 318 114 340 116 350',
          'M54 166 C48 192 48 216 52 236',
          'M146 166 C152 192 152 216 148 236',
        ]
  }
  if (view === 'back') {
    return [
      'M100 118 C100 160 100 210 100 258',
      'M74 136 C88 150 112 150 126 136',
      'M76 172 C90 186 110 186 124 172',
      'M72 214 C90 228 110 228 128 214',
      'M74 262 C90 280 110 280 126 262',
      'M80 316 C88 334 86 352 82 366',
      'M120 316 C112 334 114 352 118 366',
    ]
  }
  if (view === 'three-quarter') {
    return [
      'M106 126 C106 166 106 206 106 240',
      'M78 144 C94 156 118 158 130 148',
      'M82 178 C96 190 116 192 126 184',
      'M84 256 C100 270 122 272 134 262',
      'M86 308 C94 326 92 348 88 358',
      'M126 312 C118 330 120 348 124 360',
      'M148 158 C156 184 158 210 156 234',
    ]
  }
  return [
    'M90 118 C94 160 96 200 94 240',
    'M68 138 C82 152 98 150 108 140',
    'M126 138 C140 170 142 210 138 240',
    'M76 268 C100 286 132 280 148 268',
    'M68 318 C82 340 80 368 76 386',
    'M118 316 C132 340 130 368 126 386',
    'M70 400 C88 422 98 446 104 462',
  ]
}

/** Soft form volumes for stronger 3D (clipped to body). */
function volumeOverlays(view: ViewAngle): { d: string; opacity: number }[] {
  if (view === 'side') {
    return [
      { d: 'M70 110 C86 160 82 220 78 268 C94 278 118 270 124 248 C132 190 128 130 118 104 Z', opacity: 0.08 },
      { d: 'M92 34 C106 42 110 58 102 68 C96 72 90 64 88 54 Z', opacity: 0.07 },
      { d: 'M120 280 C140 300 144 348 136 378 C126 384 118 360 116 330 Z', opacity: 0.1 },
    ]
  }
  if (view === 'three-quarter') {
    return [
      { d: 'M70 128 C100 150 128 140 136 170 C140 210 128 250 104 266 C80 270 68 240 66 200 Z', opacity: 0.09 },
      { d: 'M128 278 C150 300 154 350 146 380 C134 386 126 360 124 330 Z', opacity: 0.14 },
      { d: 'M54 150 C44 190 48 236 56 258 C68 250 72 200 68 166 Z', opacity: 0.13 },
    ]
  }
  if (view === 'back') {
    return [
      { d: 'M70 126 C100 146 130 126 136 170 C138 214 126 250 100 266 C74 268 64 230 66 186 Z', opacity: 0.09 },
      { d: 'M58 258 C100 286 142 258 146 300 C144 334 100 356 56 334 Z', opacity: 0.11 },
    ]
  }
  return [
    { d: 'M70 126 C100 146 130 126 136 170 C138 214 126 250 100 266 C74 268 64 230 66 186 Z', opacity: 0.09 },
    { d: 'M76 278 C100 296 124 278 126 320 C124 350 100 368 76 348 Z', opacity: 0.07 },
    { d: 'M46 140 C38 184 40 228 48 250 C60 238 64 190 60 156 Z', opacity: 0.11 },
    { d: 'M154 140 C162 184 160 228 152 250 C140 238 136 190 140 156 Z', opacity: 0.11 },
  ]
}

const PULSE_IDS_FRONT = ['shoulders', 'quads-r', 'it-band-l']

export function BodySilhouette({
  gender,
  view,
  selected,
  onToggle,
  suppressTap = false,
  pressedId = null,
  onHotspotPointerDown,
}: Props) {
  const spots = hotspotsFor(view, gender)
  const guides = muscleGuides(view, gender)
  const volumes = volumeOverlays(view)
  const uid = `${gender}-${view}`
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) return
      setPulse(true)
      const t = window.setTimeout(() => {
        setPulse(false)
        try {
          localStorage.setItem(HINT_KEY, '1')
        } catch {
          /* ignore */
        }
      }, 2400)
      return () => window.clearTimeout(t)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <svg
      className="body-svg"
      viewBox="0 0 200 490"
      role="img"
      aria-label={`${gender} body, ${view} view. Tap regions that hurt.`}
    >
      <defs>
        <linearGradient id={`skin-${uid}`} x1="12%" y1="4%" x2="92%" y2="96%">
          <stop offset="0%" stopColor="#e8f4ef" />
          <stop offset="30%" stopColor="#c8e0d7" />
          <stop offset="65%" stopColor="#9ec4b8" />
          <stop offset="100%" stopColor="#6f9e93" />
        </linearGradient>
        <linearGradient id={`cyl-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.26" />
          <stop offset="22%" stopColor="#000" stopOpacity="0.05" />
          <stop offset="48%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="72%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`ao-${uid}`} cx="48%" cy="12%" r="78%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id={`rim-${uid}`} x1="0%" y1="20%" x2="70%" y2="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`soft-${uid}`} x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#1a2e2e" floodOpacity="0.16" />
        </filter>
        {/* Soft region glow — no hard rectangular stroke */}
        <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`body-clip-${uid}`}>
          <path d={silhouettePath(view, gender)} />
        </clipPath>
      </defs>

      <ellipse className="body-shadow" cx="100" cy="478" rx="48" ry="7" />

      {/* Body mesh first — continuous human silhouette */}
      <g filter={`url(#soft-${uid})`}>
        <path
          className="body-outline"
          d={silhouettePath(view, gender)}
          fill={`url(#skin-${uid})`}
        />
        <g clipPath={`url(#body-clip-${uid})`}>
          <rect x="0" y="0" width="200" height="490" fill={`url(#cyl-${uid})`} opacity="0.62" />
          <rect x="0" y="0" width="200" height="490" fill={`url(#rim-${uid})`} opacity="0.8" />
          <rect x="0" y="0" width="200" height="490" fill={`url(#ao-${uid})`} />
          {volumes.map((v, i) => (
            <path key={i} d={v.d} fill="#1a2e2e" opacity={v.opacity} />
          ))}
          {guides.map((d, i) => (
            <path key={i} className="muscle-guide" d={d} />
          ))}
        </g>
      </g>

      {/* Organic hit targets on top of body mesh — invisible at rest */}
      <g>
        {spots.map((spot) => {
          const isOn = selected.has(spot.id)
          const isPressed = pressedId === spot.id
          const isPulse = pulse && view === 'front' && PULSE_IDS_FRONT.includes(spot.id)
          return (
            <path
              key={`${view}-${spot.id}`}
              className={`hotspot${isOn ? ' selected' : ''}${isPressed ? ' pressed' : ''}${spot.id.includes('it-band') ? ' itband' : ''}${isPulse ? ' pulse' : ''}`}
              d={spot.d}
              filter={isOn || isPressed ? `url(#glow-${uid})` : undefined}
              role="button"
              tabIndex={0}
              aria-pressed={isOn}
              aria-label={`${spot.label}${isOn ? ', selected' : ''}`}
              data-region={spot.id}
              onPointerDown={(e) => {
                onHotspotPointerDown?.(spot.id, e)
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (suppressTap) return
                onToggle(spot.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle(spot.id)
                }
              }}
            >
              <title>{spot.label}</title>
            </path>
          )
        })}
      </g>
    </svg>
  )
}

/** Mini shaded figure for gender form cards — same art language as body map. */
export function MiniFigure({ gender }: { gender: Gender }) {
  const male = gender === 'male'
  const d = male
    ? 'M60 12 C70 10 78 20 76 30 C74 36 70 40 66 42 C74 48 86 58 94 74 C100 88 102 106 98 124 C96 136 92 146 88 154 C94 162 98 174 100 188 C102 204 100 224 98 244 C96 256 98 266 102 274 C104 278 100 282 92 282 L72 280 C70 268 68 252 66 234 C64 216 64 198 66 182 C62 198 60 216 58 234 C56 252 54 268 52 280 L32 282 C24 282 20 278 22 274 C26 266 28 256 26 244 C24 224 22 204 24 188 C26 174 30 162 36 154 C32 146 28 136 26 124 C22 106 24 88 30 74 C38 58 50 48 58 42 C54 40 50 36 48 30 C46 20 52 10 60 12 Z'
    : 'M60 10 C68 8 76 18 74 28 C72 34 68 38 64 40 C70 46 82 56 90 70 C96 84 96 102 92 120 C90 132 86 142 84 150 C92 162 98 180 100 196 C102 214 100 234 98 252 C96 264 98 272 102 278 C104 282 100 286 92 286 L72 284 C70 272 68 256 66 238 C64 220 64 202 66 186 C62 202 60 220 58 238 C56 256 54 272 52 284 L32 286 C24 286 20 282 22 278 C26 272 28 264 26 252 C24 234 22 214 24 196 C26 180 32 162 40 150 C38 142 34 132 32 120 C28 102 28 84 34 70 C42 56 52 46 60 40 C56 38 52 34 50 28 C48 18 54 8 60 10 Z'
  const uid = `mini-${gender}`
  return (
    <svg className="gender-preview" viewBox="0 0 120 280" aria-hidden="true">
      <defs>
        <linearGradient id={`mskin-${uid}`} x1="15%" y1="5%" x2="90%" y2="95%">
          <stop offset="0%" stopColor="#e8f4ef" />
          <stop offset="40%" stopColor="#b7d4cc" />
          <stop offset="100%" stopColor="#6f9e93" />
        </linearGradient>
        <linearGradient id={`mcyl-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        <clipPath id={`mclip-${uid}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <ellipse cx="60" cy="272" rx="28" ry="4" fill="rgba(26,46,46,0.18)" />
      <path d={d} fill={`url(#mskin-${uid})`} stroke="rgba(45,90,90,0.16)" strokeWidth="0.8" strokeLinejoin="round" />
      <g clipPath={`url(#mclip-${uid})`}>
        <rect x="0" y="0" width="120" height="280" fill={`url(#mcyl-${uid})`} opacity="0.5" />
        <path
          d={
            male
              ? 'M60 70 C60 100 60 130 60 150 M48 84 C60 92 72 92 72 84 M50 110 C60 116 70 116 70 110'
              : 'M60 68 C60 96 60 124 60 144 M50 82 C60 90 70 90 70 82 M52 108 C60 114 68 114 68 108'
          }
          fill="none"
          stroke="rgba(26,46,46,0.14)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
