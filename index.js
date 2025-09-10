require('dotenv').config();
const fetch = require('node-fetch').default;
const express = require('express');
const { title } = require('process');
const { isArray } = require('util');
const app = express();
const PORT = process.env.PORT || 9697;
const fs = require('fs').promises;

async function getChannelM3u(channel, apikey) {
    const response = await fetch(`https://tv-addon.debridio.com/${apikey}/meta/tv/${channel}`);
    const data = await response.json();
    console.log("Channel M3U data:", data);
    return data;
}

async function parsejson(json, apikey, title) {
    let arrayLength = json.metas.length;
    for (let i = 0; i < arrayLength; i++) {
        let meta = json.metas[i].id;
        console.log(`Meta ${i + 1}:`, meta);
        let m3u = await getChannelM3u(meta, apikey);
        await fs.appendFile(`./m3u/${apikey + title}.m3u`, `#EXTINF:-1 tvg-id="${m3u.meta.tvgId}" tvg-logo="${m3u.meta.logo}" group-title="${m3u.meta.genres[0]}",${m3u.meta.name}\n${m3u.meta.streams[0].url}\n`, 'utf-8');
    }
}

async function fetchM3u(apikey, region, title) {
    fetch(`https://tv-addon.debridio.com/${apikey}/catalog/tv/${region}.json`)
        .then(response => response.json())
        .then(async (data) => {
            await parsejson(data, apikey, title);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            res.status(500).send("Internal Server Error");
        });
}

async function regionIsArray(region){
        if(Array.isArray(region)){
            return region.join("+");
        }else{
            return region;
        }
}
 
app.get(`/`, async (req, res) => {
    const { apikey, region, refresh } = req.query;
    const validRegions = ['usa', 'ca', 'mx', 'uk', 'au', 'cl', 'fr', 'it', 'za', 'nz', 'ee'];
    console.log(region.length)
    let regionLength = region.length
    let title = regionIsArray(region); 
    // if(!Array.isArray(region)){
    //     if (!apikey || !region || !validRegions.includes(region)) {
    //     return res.status(400).send(`Error: Missing or invalid parms. please ensure your apikey and region is valid. valid region codes are: ${validRegions.join(', ')}`);
    // }
    //if (!apikey || !region) return res.status(400).send(`Error: Missing or invalid parms. please ensure your apikey and region is valid. valid region codes are: ${validRegions.join(', ')}`);
    for (let i = 0; i < regionLength; i++){
        console.log(i)
        console.log(region[i])
        if(!validRegions.includes(region[i])){
            console.log("didn't include thing");
            return res.status(400).send(`Error: Missing or invalid parms. please ensure your apikey and region is valid. valid region codes are: ${validRegions.join(', ')}`);
        }
    
        try {
        if(refresh === true || refresh === 'true') {
            throw new Error('refreshing m3u');
        }
        const data = await fs.readFile(`./m3u/${apikey + title}.m3u`, 'utf-8');
        res.send(data);
    } catch (error) {
        console.error(error);
        await fs.writeFile(`./m3u/${apikey + title}.m3u`, "#EXTM3U\n", 'utf-8')
        for (let i = 0; i < regionLength; i++){
            console.log(`${regionLength} ${i}`)
            await fetchM3u(apikey,region[i], title)
    }}
    const data = fs.readFile(`./m3u/${apikey + title}.m3u`, 'utf-8');
    res.send(data);
    // if (!apikey || !region || !validRegions.includes(region)) {
    //     return res.status(400).send(`Error: Missing or invalid parms. please ensure your apikey and region is valid. valid region codes are: ${validRegions.join(', ')}`);
    // 
}});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});