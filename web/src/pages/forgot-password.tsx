import { Box, Button, Link } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link';

const ForgotPassword: React.FC<{}> = ({}) => {
    const [complete, setComplete] = useState(false);
    const [, forgotPassword] = useForgotPasswordMutation();
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ email: '' }}
                onSubmit={async (values) => {
                    await forgotPassword(values);
                    setComplete(true);
                }}>
                {({ isSubmitting }) =>
                    complete ? (
                        <Box>
                            <Box>If an account with that email exists, we sent you that email.</Box>
                            <Box mt={4}>
                                <NextLink href="/login">
                                    <Link>Back to login page</Link>
                                </NextLink>
                            </Box>
                        </Box>
                    ) : (
                        <Form>
                            <InputField
                                name="email"
                                placeholder="email"
                                label="Email"
                                type="email"></InputField>
                            <Button
                                mt={4}
                                isLoading={isSubmitting}
                                variantColor="teal"
                                type="submit">
                                Send reset email
                            </Button>
                        </Form>
                    )
                }
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
