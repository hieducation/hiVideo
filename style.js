const setStyle = (custom, common) => {
    if(custom && Array.isArray(custom)){
        return [common, ...custom];
    } else if (custom && typeof custom === 'object'){
        return [common, custom];
    } else{
        return common;
    }
}

export { setStyle }