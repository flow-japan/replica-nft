require('dotenv').config();

// // Emulator
// export const apiUrl = 'http://localhost:8080';
// export const address = 'f8d6e0586b0a20c7';
// export const privateKey = '6b24f011e41c0f721605c9e2d4b6e781e50d7bc52c8a6407209aedb112e3f916';
// export const keyIndex = 0;

export const apiUrl = process.env.NODE_API_URL || 'http://localhost:8080';
export const address = process.env.OPERATOR_ADDRESS || 'f8d6e0586b0a20c7';
export const privateKey = process.env.OPERATOR_PRIVATE_KEY || '6b24f011e41c0f721605c9e2d4b6e781e50d7bc52c8a6407209aedb112e3f916';
export const keyIndex = Number(process.env.OPERATOR_KEY_INDEX || 0);
