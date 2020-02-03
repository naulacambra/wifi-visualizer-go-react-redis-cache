  const K_WIDTH = 40;
  const K_HEIGHT = 40;

  const markerStyle = {
      // initially any map object has left top corner at lat lng coordinates
      // it's on you to set object origin to 0,0 coordinates
      position: 'absolute',
      // width: K_WIDTH,
      height: K_HEIGHT,
      left: -K_WIDTH,
    //   left: 0,
      top: -K_HEIGHT,
      //   border: '5px solid #f44336',
      borderRadius: K_HEIGHT,
      //   backgroundColor: 'white',
      textAlign: 'center',
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
      padding: 4,
      background: "url('/5g.svg')",
      backgroundSize: 'contain',
      backgroundPosition: 'top center',
      backgroundRepeat: 'no-repeat',
      paddingTop: K_HEIGHT,
      backgroundSize: K_HEIGHT
  };

  export {
      markerStyle
  };