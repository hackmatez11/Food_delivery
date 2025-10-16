import axios from "axios";
import orderModel from "../models/orderModel.js";
import foodModel from "../models/foodModel.js";

const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL;  
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

export const getRecommendations = async (req, res) => {
  const { userId } = req.params;
  console.log(`✅ Fetching recommendations for user: ${userId}`);

  try {
    // 1. Fetch all orders of the user from DB
    const orders = await orderModel.find({ userId });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No order history found" });
    }

    // 2. Extract ordered food names from all orders
    const orderedFoodNames = orders.flatMap(order => order.items.map(item => item.name));
    console.log("Ordered food items:", orderedFoodNames);

    // 3. Prepare payload for Gemini API
    const payload = {
      userId,
      orderHistory: orderedFoodNames,
    };

    // 4. Call Gemini recommendation API with Authorization header
    const response = await axios.post(GEMINI_API_BASE_URL, payload, {
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // 5. Check if recommendations are received
    const recommendedFoodNames = response.data?.recommendations;
    if (!recommendedFoodNames || !Array.isArray(recommendedFoodNames)) {
      return res.status(500).json({ success: false, message: "Failed to get recommendations from Gemini" });
    }
    console.log("Recommended food items:", recommendedFoodNames);

    // 6. Fetch recommended food details from DB
    const recommendedFoods = await foodModel.find({ name: { $in: recommendedFoodNames } });

    // 7. Fetch bestsellers from DB
    const bestsellerFoods = await foodModel.find({ bestseller: true });

    // 8. Merge recommendations & bestsellers without duplicates
    const mergedMap = new Map();
    recommendedFoods.forEach(food => mergedMap.set(food._id.toString(), food));
    bestsellerFoods.forEach(food => mergedMap.set(food._id.toString(), food));
    const combinedRecommendations = Array.from(mergedMap.values());

    // 9. Respond with combined recommendations
    return res.json({ success: true, recommendations: combinedRecommendations });

  } catch (error) {
    console.error("❌ Error in getRecommendations:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching recommendations" });
  }
};
