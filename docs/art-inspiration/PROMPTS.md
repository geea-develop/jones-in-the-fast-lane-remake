# Asset Generation Prompts

Use these prompts with your preferred image generator (Midjourney, DALL-E, Flux, etc). 
Reference the style images in `docs/art-inspiration/` for consistency.

## Global Style Prefix

Use this prefix for ALL prompts:

```
Early 1990s VGA pixel-art game asset, 256-color palette, visible pixel texture,
rich saturated colors, Sierra On-Line adventure game style, detailed sprite,
```

## Building Tiles

Generate at **square aspect ratio** (1:1). Transparent or solid color background that's easy to remove.

---

### 1. Home (Low-Cost Housing)
```
[style prefix] small modest apartment building, two stories, beige/gray walls,
simple windows with curtains, small front door, a few potted plants, slightly
run-down but cozy, isometric 3/4 view, isolated on plain background
```

### 2. Rent Office
```
[style prefix] small brick office building, "RENT" sign on front, brown and tan
bricks, single door entrance, small awning, office-style windows, bureaucratic
looking, isometric 3/4 view, isolated on plain background
```

### 3. Pawn Shop
```
[style prefix] quirky pawn shop storefront, three golden balls sign above door,
cluttered window display, warm orange/brown tones, hand-painted "PAWN" sign,
slightly seedy neighborhood feel, isometric 3/4 view, isolated on plain background
```

### 4. Z-Mart (Discount Store)
```
[style prefix] large blue discount retail store, flat roof with big "Z" logo sign,
parking lot lines in front, shopping cart, blue and yellow color scheme, Walmart/
K-Mart inspired 90s style, isometric 3/4 view, isolated on plain background
```

### 5. Monolith Burgers (Fast Food)
```
[style prefix] retro fast food restaurant, red and yellow color scheme, large
illuminated "M" letter sign on roof (NOT golden arches), drive-through window,
1990s fast food joint style, isometric 3/4 view, isolated on plain background
```

### 6. QT Clothing (Fashion Boutique)
```
[style prefix] small fashion clothing boutique, purple and pink storefront,
mannequin in window, striped awning, "QT" sign in stylish font, trendy 90s
boutique feel, isometric 3/4 view, isolated on plain background
```

### 7. Socket City (Electronics)
```
[style prefix] electronics store, blue building with lightning bolt logo, "SOCKET
CITY" sign, display TVs in window, satellite dish on roof, 1990s electronics
retailer style, isometric 3/4 view, isolated on plain background
```

### 8. Hi-Tech University
```
[style prefix] grand university building, gothic/classical architecture, blue and
purple stone, clock tower, academic crest/shield, columns at entrance, ivy on walls,
prestigious college campus feel, isometric 3/4 view, isolated on plain background
```

### 9. Employment Office
```
[style prefix] brown brick office building, "JOBS" sign in window, bulletin board
visible through glass door, boring bureaucratic government office style, flat roof,
small parking area, isometric 3/4 view, isolated on plain background
```

### 10. Factory
```
[style prefix] industrial factory building, gray concrete walls, two smokestacks
with smoke, loading dock, metal pipes and vents, "FACTORY" sign, gritty working
class feel, isometric 3/4 view, isolated on plain background
```

### 11. Bank
```
[style prefix] classical bank building, stone facade with tall columns, marble steps,
ornate "BANK" carved in stone above entrance, vault-like heavy doors, clock on
front, prestigious and imposing, isometric 3/4 view, isolated on plain background
```

### 12. Black's Market (Grocery)
```
[style prefix] neighborhood grocery market, green striped awning, produce crates
outside, wooden barrel by door, "BLACK'S MARKET" hand-painted sign, warm inviting
small-town grocer feel, isometric 3/4 view, isolated on plain background
```

### 13. Entertainment (Theater/Arcade)
```
[style prefix] movie theater and arcade building, neon lights, marquee sign with
bulbs, "CINEMA" or star decorations, ticket booth window, colorful and exciting
nightlife atmosphere, isometric 3/4 view, isolated on plain background
```

---

## Character Sprites

Generate at **portrait aspect ratio** (1:2). Transparent or white background.

### Player Character
```
[style prefix] young man standing front-facing, casual 1990s outfit, white t-shirt,
blue jeans, white sneakers, dark curly hair, friendly expression, full body shot,
character sprite for game, transparent background
```

### Jones (AI Opponent)
```
[style prefix] confident man standing front-facing, 1990s business casual, polo
shirt, khaki pants, loafers, slicked-back hair, slightly smug expression, full body
shot, character sprite for game, transparent background
```

---

## Board Background (Optional)

```
[style prefix] top-down game board background, green grass texture, winding dirt/
gravel paths forming a ring/loop shape connecting 13 positions, evergreen trees
scattered around edges, small flowers and bushes, no buildings, game map background,
1200x800 pixels
```

---

## Tips

- If the generator adds too much detail, ask for "simpler" or "fewer colors"
- For transparent backgrounds, generate on solid green/magenta and remove in post
- Keep all buildings roughly the same scale so they look consistent on the board
- The pixel texture should be visible but not overwhelming — aim for "enhanced VGA" not "8-bit NES"
- Avoid any real brand logos (no actual McDonald's, Walmart, etc.)

## File Naming Convention

Save generated files as:
```
public/assets/buildings/home.png
public/assets/buildings/rent-office.png
public/assets/buildings/pawn-shop.png
public/assets/buildings/z-mart.png
public/assets/buildings/monolith-burgers.png
public/assets/buildings/qt-clothing.png
public/assets/buildings/socket-city.png
public/assets/buildings/university.png
public/assets/buildings/employment-office.png
public/assets/buildings/factory.png
public/assets/buildings/bank.png
public/assets/buildings/blacks-market.png
public/assets/buildings/entertainment.png

public/assets/characters/player.png
public/assets/characters/jones.png

public/assets/board-bg.png (optional)
```
