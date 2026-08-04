// Builds a formatter
// Currently just does USD, but we can add a param to control this later
export default new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
})