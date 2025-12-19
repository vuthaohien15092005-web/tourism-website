const express = require('express');
const router = express.Router();

// Import models
const Entertainment = require('../../model/Entertainment');
const Attraction = require('../../model/Attraction');
const Accommodation = require('../../model/Accommodation');
const CuisinePlace = require('../../model/CuisinePlace');

// Helper function to get model by type
function getModelByType(type) {
  switch (type) {
    case 'entertainment':
      return Entertainment;
    case 'attraction':
      return Attraction;
    case 'accommodation':
      return Accommodation;
    case 'cuisine':
      return CuisinePlace;
    default:
      throw new Error('Invalid type');
  }
}

// GET /api/nearby-places/:currentType/:currentId/cuisine
router.get('/:currentType/:currentId/cuisine', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { currentType, currentId } = req.params;
    const { radius = 5, limit = 6 } = req.query;
    
    console.log(`[API] Finding nearby cuisine places for ${currentType}:${currentId} (radius: ${radius}km, limit: ${limit})`);
    
    const currentModel = getModelByType(currentType);
    const nearbyPlaces = await currentModel.findNearbyCuisinePlaces(
      currentId, 
      parseFloat(radius), 
      parseInt(limit)
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] Found ${nearbyPlaces.length} nearby cuisine places in ${responseTime}ms`);
    
    res.json(nearbyPlaces);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[API] Error fetching nearby cuisine places after ${responseTime}ms:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/nearby-places/:currentType/:currentId/accommodation
router.get('/:currentType/:currentId/accommodation', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { currentType, currentId } = req.params;
    const { radius = 5, limit = 6 } = req.query;
    
    console.log(`[API] Finding nearby accommodations for ${currentType}:${currentId} (radius: ${radius}km, limit: ${limit})`);
    
    const currentModel = getModelByType(currentType);
    const nearbyPlaces = await currentModel.findNearbyAccommodations(
      currentId, 
      parseFloat(radius), 
      parseInt(limit)
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] Found ${nearbyPlaces.length} nearby accommodations in ${responseTime}ms`);
    
    res.json(nearbyPlaces);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[API] Error fetching nearby accommodations after ${responseTime}ms:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/nearby-places/:currentType/:currentId/attraction
router.get('/:currentType/:currentId/attraction', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { currentType, currentId } = req.params;
    const { radius = 5, limit = 6 } = req.query;
    
    console.log(`[API] Finding nearby attractions for ${currentType}:${currentId} (radius: ${radius}km, limit: ${limit})`);
    
    const currentModel = getModelByType(currentType);
    const nearbyPlaces = await currentModel.findNearbyAttractions(
      currentId, 
      parseFloat(radius), 
      parseInt(limit)
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] Found ${nearbyPlaces.length} nearby attractions in ${responseTime}ms`);
    
    res.json(nearbyPlaces);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[API] Error fetching nearby attractions after ${responseTime}ms:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/nearby-places/:currentType/:currentId/entertainment
router.get('/:currentType/:currentId/entertainment', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { currentType, currentId } = req.params;
    const { radius = 5, limit = 6 } = req.query;
    
    console.log(`[API] Finding nearby entertainments for ${currentType}:${currentId} (radius: ${radius}km, limit: ${limit})`);
    
    const currentModel = getModelByType(currentType);
    const nearbyPlaces = await currentModel.findNearbyEntertainments(
      currentId, 
      parseFloat(radius), 
      parseInt(limit)
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] Found ${nearbyPlaces.length} nearby entertainments in ${responseTime}ms`);
    
    res.json(nearbyPlaces);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[API] Error fetching nearby entertainments after ${responseTime}ms:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
