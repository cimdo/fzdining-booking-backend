const paginate = (list, page_size, page_number) => {
    return list.slice((page_number - 1) * page_size, page_number * page_size);
}

module.exports = paginate;