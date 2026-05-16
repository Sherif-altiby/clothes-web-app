import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return hashedPassword;
};


export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};