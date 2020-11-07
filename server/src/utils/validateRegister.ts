import { UsernamePasswordInput } from 'src/resolvers/UsernamePasswordInput';

export const validateRegister = (options: UsernamePasswordInput) => {
    if (!options.email.includes('@')) {
        return [
            {
                field: 'email',
                message: 'email must include an @ sign',
            },
        ];
    }

    if (options.username.length <= 2) {
        return [
            {
                field: 'username',
                message: 'username must be greater than 2 characters',
            },
        ];
    }

    if (options.password.length <= 3) {
        return [
            {
                field: 'password',
                message: 'password must be greater than 3 characters',
            },
        ];
    }

    if (options.username.includes('@')) {
        return [
            {
                field: 'username',
                message: 'username must not include an @ sign',
            },
        ];
    }

    return null;
};
