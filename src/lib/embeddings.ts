import {pipeline, type FeatureExtractionPipeline} from '@huggingface/transformers'

let extractor : FeatureExtractionPipeline | null = null;

async function getExtractor(){
    if(!extractor){
        extractor = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
    }
    return extractor;
}

export async function embedText(text: string): Promise<number[]>{
    const model = await getExtractor();
    const output = await model(text,{pooling:'mean', normalize: true});
    return Array.from(output.data as Float32Array);
}