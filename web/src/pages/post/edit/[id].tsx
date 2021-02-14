import { Box, Button } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import { usePostQuery, useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetIntId } from '../../../utils/useGetIntId';

export const EditPost = ({}) => {
    const router = useRouter();
    const intId = useGetIntId();
    const [{ data, fetching }] = usePostQuery({
        pause: intId === -1,
        variables: {
            id: intId,
        },
    });
    const [, updatePost] = useUpdatePostMutation();
    if (fetching) {
        return (
            <Layout>
                <div>Loading...</div>
            </Layout>
        );
    }

    if (!data?.post) {
        return (
            <Layout>
                <Box>Could not find post</Box>
            </Layout>
        );
    }
    return (
        <Layout variant="small">
            <Formik
                initialValues={{ title: data.post.title, text: data.post.text }}
                onSubmit={async (values) => {
                    // const { error } = await createPost({ input: values });
                    // if (!error) {
                    //     router.push('/');
                    // }
                    await updatePost({ id: intId, ...values });
                    router.push('/');
                }}>
                {({ isSubmitting }) => (
                    <Form>
                        <InputField name="title" placeholder="title" label="Title"></InputField>
                        <Box mt={4}>
                            <InputField
                                textarea
                                name="text"
                                placeholder="text..."
                                label="Body"></InputField>
                        </Box>
                        <Button mt={4} isLoading={isSubmitting} variantColor="teal" type="submit">
                            Update post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(EditPost);
