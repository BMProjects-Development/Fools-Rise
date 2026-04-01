const PROGRESSION = [
  {
    stage: 0,
    dimension: "aether:the_aether",
    boss: "minecraft:wither",
  },
  {
    stage: 1,
    dimension: "minecraft:the_nether",
    boss: "minecraft:wither",
  },
  {
    stage: 2,
    dimension: "minecraft:the_end",
    boss: "minecraft:ender_dragon",
  },
];

const SpawnManager = {
  settings: {
    maxDistance: 384,
    step: 16,
    safeHeight: 2,
  },

  isSafe(block) {
    const platform = block;
    const body = block.up;
    const head = body.up;

    return (
      platform.solid &&
      !platform.liquid &&
      platform.id !== "minecraft:magma_block" &&
      platform.id !== "minecraft:fire" &&
      body.air &&
      head.air
    );
  },

  findSafeLocation(level) {
    let x = 0;
    let z = 0;
    let dx = 0;
    let dz = -1;
    let maxSteps = Math.pow(
      (this.settings.maxDistance / this.settings.step) * 2,
      2,
    );

    for (let i = 0; i < maxSteps; i++) {
      let foundY = this.scanPoint(level, x, z);
      if (foundY !== null) return { x: x, y: foundY, z: z };

      if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) {
        let temp = dx;
        dx = -dz;
        dz = temp;
      }
      x += dx * this.settings.step;
      z += dz * this.settings.step;
    }
    return null;
  },

  scanPoint(level, x, z) {
    if (level.dimension == "minecraft:the_nether") {
      for (let y = 115; y >= 32; y--) {
        let block = level.getBlock(x, y, z);
        if (this.isSafe(block)) return y + 1;
      }
      return null;
    }

    let topY = level.getHeight("motion_blocking", x, z);

    if (topY <= level.minBuildHeight) return null;

    let block = level.getBlock(x, topY - 1, z);
    if (this.isSafe(block)) {
      return topY;
    }
    return null;
  },

  createFallbackPlatform(level, x, y, z) {
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        level.setBlock(
          new BlockPos(x + ox, y - 1, z + oz),
          "minecraft:stone",
          3,
        );
      }
    }
  },
};

function transitionPlayer(player, stageIndex) {
  const config = PROGRESSION[stageIndex];

  const level = player.server.getLevel(config.dimension);

  let pos = SpawnManager.findSafeLocation(level);
  player.tell(Text.of("Телепортация в " + config.dimension));
  if (!pos) {
    console.warn(
      `KubeJS: Безопасное место в ${config.dimension} не найдено. Создаем платформу.`,
    );
    pos = { x: 0, y: 100, z: 0 };

    if (config.dimension !== "minecraft:the_nether") {
      SpawnManager.createFallbackPlatform(level, pos.x, pos.y, pos.z);
    }
  }

  if (stageIndex > 0) {
    player.inventory.clear();
    player.tell(
      Text.of("Ваш инвентарь очищен. Начинается новый этап!").darkRed(),
    );
  }

  player.teleportTo(config.dimension, pos.x, pos.y, pos.z, 0, 0);
  player.setRespawnPosition(
    config.dimension,
    new BlockPos(pos.x, pos.y, pos.z),
    0,
    true,
    false,
  );
  player.persistentData.currentStage = stageIndex;
}

PlayerEvents.loggedIn((event) => {
  let { player } = event;
  if (!player.persistentData.hasJoinedBefore) {
    transitionPlayer(player, 0);
    player.persistentData.hasJoinedBefore = true;
  }
});

EntityEvents.death((event) => {
  let { entity, source } = event;
  let killer = event.entity.lastHurtByMob;
  if (!killer) return;

  let player = killer;
  let currentStage = (player.persistentData.currentStage || 0) | 0;
  let currentConfig = PROGRESSION[currentStage];

  if (currentConfig && entity.type === currentConfig.boss) {
    // Задержка в 1 тик, чтобы избежать конфликтов во время смерти сущности
    event.server.scheduleInTicks(20, (callback) => {
      transitionPlayer(player, currentStage + 1);
    });
  }
});

PlayerEvents.respawned((event) => {
  let { player } = event;
  let currentStage = (player.persistentData.currentStage || 0) | 0;
  let config = PROGRESSION[currentStage];

  if (player.level && player.level.dimension != config.dimension) {
    transitionPlayer(player, currentStage);
  }
});

const AetherGuard = {
  threshold: 5,
  handleFall(event) {
    const { player, level, server } = event;

    if (level.dimension == "aether:the_aether" && player.y < this.threshold) {
      let x = player.x;
      let z = player.z;

      let topY = level.getHeight("motion_blocking", x, z);

      if (topY <= level.minBuildHeight) {
        let safePos = SpawnManager.findSafeLocation(level);
        if (safePos) {
          this.teleport(server, player, safePos.x, safePos.y, safePos.z);
        } else {
          this.teleport(server, player, x, 256, z);
          player.potionEffects.add("minecraft:slow_falling", 20 * 40, 0);
        }
      } else {
        this.teleport(server, player, x, topY + 1, z);
      }
    }
  },

  teleport(server, player, x, y, z) {
    player.teleportTo("aether:the_aether", x, y, z, player.yaw, player.pitch);
  },
};

PlayerEvents.tick((event) => {
  AetherGuard.handleFall(event);
});
