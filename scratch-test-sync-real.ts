import "dotenv/config";
import { InstagramSyncService } from "./src/services/instagram";

async function main() {
  const ids = [
    "cmqpefapm008y04lawwl0fbek", // kaljitatwal
    "cmqpefapm008z04la8sczvl57", // katlinsannan
    "cmqpefapl008x04lag0la1eix", // iishmita
  ];
  const service = new InstagramSyncService();
  for (const id of ids) {
    try {
      const result = await service.syncInfluencer(id);
      console.log(`SUCCESS ${id}:`, JSON.stringify(result.profile), "errors:", result.errors);
    } catch (e: any) {
      console.error(`FAILED ${id}:`, e.message);
    }
  }
}

main().finally(() => process.exit(0));
