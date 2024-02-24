import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { type Document } from "@langchain/core/documents";
import { ChatOpenAI } from "@langchain/openai";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { MultiVectorRetriever } from "langchain/retrievers/multi_vector";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { SupabaseTranslator } from "langchain/retrievers/self_query/supabase";
import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import { InMemoryStore } from "langchain/storage/in_memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { attributeInfo } from "./variables";

let resolveWithDocuments: (value: Document[]) => void;

const MAX_DOCUMENT_RETRIEVAL_TIME = 5000;

export const documentPromise = new Promise<Document[]>((resolve, reject) => {
    resolveWithDocuments = resolve;
    setTimeout(() => {
        return reject("Document retrieval timed out");
    }, MAX_DOCUMENT_RETRIEVAL_TIME);
});

export function ContextualCompression(
    model: ChatOpenAI,
    vectorstore: SupabaseVectorStore,
) {
    const baseCompressor = LLMChainExtractor.fromLLM(model);

    return new ContextualCompressionRetriever({
        baseCompressor,
        baseRetriever: vectorstore.asRetriever(),
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ],
    })
}

export function MultiQuery(
    model: ChatOpenAI,
    vectorstore: SupabaseVectorStore,
) {

    return MultiQueryRetriever.fromLLM({
        llm: model,
        retriever: vectorstore.asRetriever(),
        verbose: false,
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ],
    });
}

export function ParentDocument(
    vectorstore: SupabaseVectorStore,
) {

    const docstore = new InMemoryStore();

    return new ParentDocumentRetriever({
        vectorstore,
        docstore,
        childSplitter: new RecursiveCharacterTextSplitter(),
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ],
    });
}

export function SelfQuery(
    model: ChatOpenAI,
    vectorstore: SupabaseVectorStore,
    currentMessageContent: string,
) {

    return SelfQueryRetriever.fromLLM({
        llm: model,
        vectorStore: vectorstore,
        documentContents: currentMessageContent,
        attributeInfo,
        structuredQueryTranslator: new SupabaseTranslator(),
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ],
    })
}

export function SimilarityScore(
    vectorstore: SupabaseVectorStore,
) {

    return ScoreThresholdRetriever.fromVectorStore(vectorstore, {
        minSimilarityScore: 0,
        maxK: 100,
        kIncrement: 2,
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ]
    });
}

export function TimeWeighted(
    vectorstore: SupabaseVectorStore
) {
    return new TimeWeightedVectorStoreRetriever({
        vectorStore: vectorstore,
        memoryStream: [],
        searchKwargs: 2,
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ]
    });
}

export function VectorStore(
    vectorstore: SupabaseVectorStore
) {

    return vectorstore.asRetriever({
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ],
    });
}

export function MultiVector(
    vectorstore: SupabaseVectorStore,
) {
    const byteStore = new InMemoryStore<Uint8Array>();

    return new MultiVectorRetriever({
        vectorstore,
        byteStore,
        callbacks: [
            {
                handleRetrieverEnd(documents) {
                    resolveWithDocuments(documents);
                },
            },
        ],
    });

}