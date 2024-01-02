const calculateNumberOfPage = (list, page_size) => {
    return Math.ceil(list/page_size);
}

module.exports = calculateNumberOfPage;