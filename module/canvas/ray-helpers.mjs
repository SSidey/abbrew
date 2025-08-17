// function getSpacesBetweenTokens(origin, originSize, destination, destinationSize) {
//     // const ray = foundry.canvas.geometry.Ray.fromArrays([origin.x, origin.y], [destination.x, destination.y]);
//     // ray.distance;
//     // ray.angle;
//     // console.log(JSON.stringify(ray))
//     // const adjustedAngle = wrapToQuarterPi(ray.angle);
//     // const distance = ray.distance / 100 - getTokenCenterOffset(originSize, adjustedAngle) - getTokenCenterOffset(destinationSize, adjustedAngle);
// }

// function getTokenCenterOffset(tokenSize, angle) {
//     return tokenSize / (2 * Math.cos(angle));
// }

// const QPI = Math.PI / 4;   // π/4
// const PERIOD = Math.PI / 2; // π/2

// // Euclidean modulo (always in [0, n) even for negative a)
// function emod(a, n) {
//     return a - n * Math.floor(a / n);
// }

// function wrapToQuarterPi(theta) {
//     // First get value in [-π/4, π/4)
//     let x = emod(theta + QPI, PERIOD) - QPI;

//     // Convert the left endpoint to the right to get (-π/4, π/4]
//     if (Math.abs(x + QPI) <= 1e-12) x = QPI;
//     return x;
// }