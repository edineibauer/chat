async function momentdata(data) {
    for(let d of data)
        d.ultima_vez_online = moment(d.ultima_vez_online).calendar();

    return data;
}