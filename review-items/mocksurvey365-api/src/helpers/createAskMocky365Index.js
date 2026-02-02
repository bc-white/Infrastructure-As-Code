const mongoose = require("mongoose");

/**
 * Create MongoDB indexes for Ask Mocky365 Agent optimization
 * Run this once to create indexes for faster F-tag and pathway searches
 */
async function createAskMocky365Indexes() {
  try {
    console.log("🚀 Creating MongoDB indexes for Ask Mocky365 Agent...");
    
    const collection = mongoose.connection.collection("askmocky365_chunks");
    
    // 1. Text index on chunks array for F-tag search
    console.log("📝 Creating text index on chunks...");
    await collection.createIndex(
      { "chunks": "text" },
      { 
        name: "chunks_text_index",
        background: true,
        textIndexVersion: 3
      }
    );
    
    // 2. Compound index for type + source (pathway filtering)
    console.log("📝 Creating compound index on type + source...");
    await collection.createIndex(
      { "type": 1, "source": 1 },
      { 
        name: "type_source_index",
        background: true
      }
    );
    
    // 3. Index on type + userId for pathway user filtering
    console.log("📝 Creating index on type + userId...");
    await collection.createIndex(
      { "type": 1, "userId": 1 },
      { 
        name: "type_userId_index",
        background: true
      }
    );
    
    // 4. Index on pathwayId for pathway lookups
    console.log("📝 Creating index on pathwayId...");
    await collection.createIndex(
      { "pathwayId": 1 },
      { 
        name: "pathwayId_index",
        background: true
      }
    );
    
    // 5. Index on processedAt for update detection
    console.log("📝 Creating index on processedAt...");
    await collection.createIndex(
      { "processedAt": 1 },
      { 
        name: "processedAt_index",
        background: true
      }
    );
    
    console.log("✅ All indexes created successfully!");
    
    // Show existing indexes
    const indexes = await collection.indexes();
    console.log("\n📋 Current indexes:");
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    return { success: true, indexCount: indexes.length };
    
  } catch (error) {
    console.error("❌ Error creating indexes:", error.message);
    throw error;
  }
}

/**
 * Drop all Ask Mocky365 indexes (for cleanup/recreation)
 */
async function dropAskMocky365Indexes() {
  try {
    console.log("🗑️  Dropping Ask Mocky365 indexes...");
    
    const collection = mongoose.connection.collection("askmocky365_chunks");
    
    const indexesToDrop = [
      "chunks_text_index",
      "type_source_index", 
      "type_userId_index",
      "pathwayId_index",
      "processedAt_index"
    ];
    
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        if (error.message.includes("index not found")) {
          console.log(`⚠️  Index not found: ${indexName}`);
        } else {
          console.error(`❌ Error dropping ${indexName}:`, error.message);
        }
      }
    }
    
    console.log("✅ Index cleanup completed");
    return { success: true };
    
  } catch (error) {
    console.error("❌ Error dropping indexes:", error.message);
    throw error;
  }
}

module.exports = {
  createAskMocky365Indexes,
  dropAskMocky365Indexes
};
