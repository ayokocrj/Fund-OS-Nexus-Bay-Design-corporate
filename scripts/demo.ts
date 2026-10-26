import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { db, disconnect } from "../artifacts/fund-os-core/src/domain/db";
import { runEpisode } from "../artifacts/fund-os-core/src/agent/loop";
import { replay, verifyChain } from "../artifacts/fund-os-core/src/domain/ledger";
const output = fileURLToPath(new URL("../generated-artifacts/phase0/", import.meta.url));
try {
  const actor = { firmId: "bay", userId: "demo-bay-builder" };
  const episode = await runEpisode(actor, "bay-org-001");
  const trace = { episode, replay: await replay(actor, episode.episode_id), ledger: await verifyChain() };
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/episode-trace.json`, JSON.stringify(trace, null, 2));
  console.log(JSON.stringify(trace, null, 2));
  if (episode.status !== "done" || episode.critic_verdict !== "passed" || !trace.ledger.valid || !trace.replay.verified) process.exitCode = 1;
} finally { await disconnect(); }
