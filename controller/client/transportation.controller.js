// ===========================================
// Transportation Controller (Client)
// Static content only - no database queries
// ===========================================

module.exports.transportation = async (req, res) => {
    try {
        res.render('client/pages/transportation/transportation.ejs');
    } catch (error) {
        console.error('Client transportation error:', error);
        res.status(500).render('errors/500.ejs', { error: error.message });
    }
}
