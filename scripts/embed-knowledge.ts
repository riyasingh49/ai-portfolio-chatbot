// import dotenv from 'dotenv'
// dotenv.config({path:'.env.local'});
import fs from 'fs';
import path from 'path';
import { embedText } from '../src/lib/embeddings';
import { clearKnowledgeBase, insertKnowledgeEntry } from '../src/db/knowledgeBase';

async function main() {
    const filePath = path.join(process.cwd(), 'data', "knowledge_base.json");
    const rawData = fs.readFileSync(filePath,'utf-8');
    const entries: {content : string}[] = JSON.parse(rawData);

    console.log(`Found ${entries.length} entries. Clearing old data...`);
    await clearKnowledgeBase();

    for(const [index, entry] of entries.entries()){
        const embedding = await embedText(entry.content);
        const {error} = await insertKnowledgeEntry(entry.content, embedding);

        if(error){
            console.error(`Failed on entry ${index}:`,error.message);
        }else{
            console.log(`Embedded (${index + 1}/${entries.length})`);
        }

    }
    console.log("Done");
}

main();
